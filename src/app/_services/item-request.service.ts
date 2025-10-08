import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemRequest } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class ItemRequestService {
  private base = `${environment.apiUrl}/req-item`;

  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<ItemRequest[]> {
    return this.http.get<any>(this.base, { params }).pipe(map(res => (res?.data || res) as ItemRequest[]));
  }

  get(id: any): Observable<ItemRequest> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.get<any>(`${this.base}/${n}`).pipe(map(res => (res?.data || res) as ItemRequest));
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  accept(id: any): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/accept`, {});
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
