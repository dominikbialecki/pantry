import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Meal } from '../../modules/dashboard/modules/meal/meal.model';

@Injectable()
export class MealService {

  private mealsUrl = 'http://localhost:8080/meal';

  constructor(private http: HttpClient) {}

  getMeals(): Observable<Meal[]> {
    return this.http.get<Meal[]>(this.mealsUrl);
  }

}
