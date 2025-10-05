import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockRequest } from '@app/_models/stock-request.model';

@Injectable({ providedIn: 'root' })
export class StockRequestService {
  private base = `${environment.apiUrl}/req-stock`;

  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<StockRequest[]> {
    return this.http.get<any>(this.base, { params }).pipe(
      map(res => (res?.data || res) as StockRequest[])
    );
  }

  get(id: any): Observable<StockRequest> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.get<any>(`${this.base}/${numeric}`).pipe(
      map(res => (res?.data || res) as StockRequest)
    );
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}`, payload);
  }

  approve(id: any): Observable<any> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${numeric}/approve`, {});
  }

  disapprove(id: any, reason?: string): Observable<any> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${numeric}/disapprove`, { reason });
  }

  fulfill(id: any): Observable<any> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${numeric}/fulfill`, {});
  }
}