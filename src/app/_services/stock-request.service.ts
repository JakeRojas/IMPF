import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockRequest } from '@app/_models/stock-request.model';

@Injectable({ providedIn: 'root' })
export class StockRequestService {
  private base = `${environment.apiUrl}/req-stock`;

  constructor(private http: HttpClient) { }

  list(params: any = {}, page: number = 1, limit: number = 10): Observable<{ data: StockRequest[], meta: any }> {
    const qParams = { ...params, page: page.toString(), limit: limit.toString() };
    return this.http.get<any>(this.base, { params: qParams }).pipe(
      map(res => {
        return {
          data: (res?.data || res) as StockRequest[],
          meta: res?.meta
        };
      })
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

  // approve(id: any): Observable<any> {
  //   const numeric = Number(id);
  //   if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
  //   return this.http.post<any>(`${this.base}/${numeric}/approve`, {});
  // }
  approve(id: any, quantity?: number): Observable<any> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || numeric <= 0) return throwError(() => new Error('Invalid id'));
    // [MODIFIED] Send quantity in body
    return this.http.post<any>(`${this.base}/${numeric}/approve`, { quantity });
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