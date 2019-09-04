import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardNavigationService } from '../dashboard-navigation.service';
import { DashboardNavigationDataDictionary } from '../dashboard-navigation-data';
import { DashboardNavigationDataEnum } from '../dashboard-navigation-data.enum';

@Component({
  selector: 'diet-fridge',
  template: `
      Witaj w lodówce heh
      <div class="diet-fridge-wrapper">
          <div class="diet-fridge">
              <div class="diet-fridge-meals"
                   [title]="getTitle(DashboardNavigationDataEnum.MEALS) | translate"
                   (click)="onNavigationClick(DashboardNavigationDataEnum.MEALS)"
              ></div>
              <div class="diet-fridge-products"
                   [title]="getTitle(DashboardNavigationDataEnum.PRODUCTS) | translate"
                   (click)="onNavigationClick(DashboardNavigationDataEnum.PRODUCTS)"
              ></div>
              <div class="diet-fridge-calendar"
                   [title]="getTitle(DashboardNavigationDataEnum.DAY_PLAN) | translate"
                   (click)="onNavigationClick(DashboardNavigationDataEnum.DAY_PLAN)"
              ></div>
              <div class="diet-fridge-shopping-list"
                   [title]="getTitle(DashboardNavigationDataEnum.SHOPPING_LIST) | translate"
                   (click)="onNavigationClick(DashboardNavigationDataEnum.SHOPPING_LIST)"
              ></div>
              <div class="diet-fridge-settings"
                   [title]="getTitle(DashboardNavigationDataEnum.SETTINGS) | translate"
                   (click)="onNavigationClick(DashboardNavigationDataEnum.SETTINGS)"
              ></div>
          </div>
      </div>
  `,
  styleUrls: [ './fridge.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FridgeComponent {

  DashboardNavigationDataEnum: typeof DashboardNavigationDataEnum = DashboardNavigationDataEnum;
  readonly navigationData: DashboardNavigationDataDictionary;

  constructor(dashboardNavigationService: DashboardNavigationService) {
    this.navigationData = dashboardNavigationService.getNavigationDataDictionary();
  }

  getTitle(key: DashboardNavigationDataEnum): string {
    return this.navigationData[key].translationKey;
  }

  onNavigationClick(key: DashboardNavigationDataEnum): void {
    this.navigationData[key].navigationCallback();
  }
}
