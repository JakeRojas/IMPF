import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class StatsService {
    constructor(private http: HttpClient) { }

    getDashboardStats() {
        return this.http.get<any>(`${environment.apiUrl}/stats/dashboard`);
    }
}
