import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemRequest } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class ItemRequestService {
  private base = `${environment.apiUrl}/req-item`;

  constructor(private http: HttpClient) { }

  list(params: any = {}, page: number = 1, limit: number = 10): Observable<{ data: ItemRequest[], meta: any }> {
    const qParams = { ...params, page: page.toString(), limit: limit.toString() };
    return this.http.get<any>(this.base, { params: qParams }).pipe(map(res => {
      return {
        data: (res?.data || res) as ItemRequest[],
        meta: res?.meta
      };
    }));
  }

  get(id: any): Observable<ItemRequest> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.get<any>(`${this.base}/${n}`).pipe(map(res => (res?.data || res) as ItemRequest));
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  accept(id: any, updateData: any = {}): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/accept`, updateData);
  }

  decline(id: any, reason?: string): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/decline`, { reason });
  }

  release(id: any): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/release`, {});
  }

  fulfill(id: any): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/fulfill`, {});
  }
}
