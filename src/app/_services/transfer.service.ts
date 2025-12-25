import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transfer } from '@app/_models/transfer.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private base = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<Transfer[]> {
    return this.http.get<any>(this.base, { params }).pipe(
      map(res => (res?.data || res) as Transfer[])
    );
  }

  get(id: any): Observable<Transfer> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.get<any>(`${this.base}/${n}`).pipe(map(res => (res?.data || res) as Transfer));
  }

  create(payload: Partial<Transfer>): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  getById(id: string | number) {
    return this.http.get(`${this.base}/${id}`).pipe(
      // if your API wraps in { data: ... } remove the map or adjust
      map((res: any) => res)
    );
  }

  accept(id: any): Observable<any> {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return throwError(() => new Error('Invalid id'));
    return this.http.post<any>(`${this.base}/${n}/accept`, {});
  }
}
