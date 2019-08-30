import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../app.recuder';
import * as fromDayPlan from './day-plan.reducer';
import * as DayPlanActions from './day-plan.actions';
import { addDays, getDay } from '../../../shared/utils/date-utils';
import { Summary } from '../../../../api/models/summary';
import { DayMeal } from '../../../../api/models/day-meal.model';
import { combineLatest, filter, map } from 'rxjs/operators';
import { DashboardScrollPositionService } from '../../dashboard-scroll-position.service';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddMealDialogComponent } from './components/add-meal-dialog/add-meal-dialog.component';
import { Meal } from '../meal/meal.model';
import { selectFirst } from '../../../shared/utils/ngrx-utils';
import { Day } from '../../../../api/models/day';

@Component({
  selector: 'diet-day-plan',
  template: `
      <div class="diet-day-plan-wrapper">
          <diet-day-plan-calendar class="diet-day-plan-calendar"
                                  [selectedDate]="getSelectedDate() | async"
                                  (newDaySelected)="onNewDaySelected($event)"
          ></diet-day-plan-calendar>
          <div class="diet-day-plan-meals">
              <ul *ngIf="(shouldDisplayDayPlanMeals() | async)" class="diet-day-plan-meal-list">
                  <li *ngFor="let dayMeal of (getSelectedDayPlanDayMeals() | async)">
                      <diet-day-plan-meal
                              [dayMeal]="dayMeal"
                              (deleteDayMeal)="onDeleteDayMeal(dayMeal)"
                              (mealEatenMarkChanged)="onMealEatenMarkChanged(dayMeal, $event)"></diet-day-plan-meal>
                  </li>
              </ul>
              <diet-add-button
                      class="diet-day-plan-add-meal"
                      title="{{'DAY_PLAN.ADD_MEAL' | translate}}"
                      (click)="onAddMealButtonClick()"></diet-add-button>
          </div>
          <diet-day-plan-stats *ngIf="(shouldDisplayDayPlanStats() | async)"
                               class="diet-day-plan-stats"
                               [class.diet-day-plan-stats--hidden]="!(shouldExpandStats() | async)"
                               [isExpanded]="shouldExpandStats() | async"
                               (toggleExpansion)="onToggleExpansion()"
                               [summary]="getSelectedDayPlanSummary() | async"
                               [eatenMealsSummary]="getSelectedDayPlanEatenMealsSummary() | async">
          </diet-day-plan-stats>
      </div>
  `,
  styleUrls: [ './day-plan.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayPlanComponent implements OnInit {

  private STATS_EXPAND_SCROLL_THRESHOLD_PX = 20;
  private readonly PREVIOUS_DAYS_QUANTITY = 3;
  private readonly NEXT_DAYS_QUANTITY = 3;


  constructor(private store: Store<AppState>,
              private dashboardScrollPosition: DashboardScrollPositionService,
              private matDialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    const day = new Date();
    this.selectDay(day);
    this.loadNearbyDays(day);

  }

  onNewDaySelected(day: Date): void {
    this.selectDay(day);
    this.loadNearbyDays(day);
  }

  private selectDay(date: Date): void {
    this.store.dispatch(DayPlanActions.selectDay({ date }));
  }

  private loadNearbyDays(date: Date): void {
    const day = getDay(date);
    const fromDate = addDays(day, -this.PREVIOUS_DAYS_QUANTITY);
    const toDate = addDays(day, this.NEXT_DAYS_QUANTITY);
    this.store.dispatch(DayPlanActions.loadDays({ fromDate, toDate }));
  }

  onDeleteDayMeal(dayMealToDelete: DayMeal): void {
    this.store.dispatch(DayPlanActions.deleteSelectedDayDayMeal({ dayMeal: dayMealToDelete }));
  }

  onMealEatenMarkChanged(dayMeal: DayMeal, eaten: boolean): void {
    const dayMealToUpdate = { ...dayMeal, eaten };
    this.store.dispatch(DayPlanActions.updateSelectedDayDayMeal({ dayMeal: dayMealToUpdate }));
  }

  onToggleExpansion(): void {
    this.store.dispatch(DayPlanActions.toggleStatsVisibility());
  }

  shouldDisplayDayPlanMeals(): Observable<boolean> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanExists);
  }

  shouldDisplayDayPlanStats(): Observable<boolean> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanDayMeals)
      .pipe(map(meals => !!meals && !!meals.length));
  }

  shouldExpandStats(): Observable<boolean> {
    return this.store.select(fromDayPlan.selectShouldShowStats)
      .pipe(
        combineLatest(this.dashboardScrollPosition.isScrolledToBottom(this.STATS_EXPAND_SCROLL_THRESHOLD_PX)),
        map(([ shouldShowStats, isScrolledToBottom ]) => shouldShowStats || isScrolledToBottom)
      );
  }

  getSelectedDate(): Observable<Date> {
    return this.store.select(fromDayPlan.selectSelectedDate);
  }

  shouldDisplayDayPlan(): Observable<boolean> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanExists);
  }

  getSelectedDayPlanDayMeals(): Observable<DayMeal[] | undefined> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanDayMeals);
  }

  getSelectedDayPlanSummary(): Observable<Summary | undefined> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanSummary);
  }

  getSelectedDayPlanEatenMealsSummary(): Observable<Summary | undefined> {
    return this.store.select(fromDayPlan.selectSelectedDayPlanEatenMealsSummary);
  }

  onAddMealButtonClick(): void {
    const dialogRef: MatDialogRef<AddMealDialogComponent, { meal: Meal }> = this.matDialog.open(AddMealDialogComponent, {
      width: '70vw',
      height: '70vh'
    });
    dialogRef.afterClosed()
      .pipe(filter(m => !!m))
      .subscribe(result => this.addDayMealToSelectedDay(result!.meal));
  }

  private addDayMealToSelectedDay(meal: Meal): void {
    selectFirst(this.store, fromDayPlan.selectDayPlan).subscribe((state: fromDayPlan.State) => {
      const dayMeal = { meal, eaten: false } as DayMeal;
      if (state.selectedDay) {
        this.appendDayMealToSelectedDay(dayMeal, state.selectedDay);
      } else {
        this.createDayWithDayMeal(dayMeal, state.selectedDate);
      }
    });
  }

  private appendDayMealToSelectedDay(dayMeal: DayMeal, selectedDay: Day): void {
    const updatedDay: Day = {
      ...selectedDay,
      dayMeals: [ ...selectedDay.dayMeals, dayMeal ],
    };
    this.store.dispatch(DayPlanActions.updateDay({ day: updatedDay }));
  }

  private createDayWithDayMeal(dayMeal: DayMeal, selectedDate: Date): void {
    const day = { dayMeals: [ dayMeal ], date: selectedDate.getTime() } as Partial<Day>;
    this.store.dispatch(DayPlanActions.createDay({ day }));
  }
}
