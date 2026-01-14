import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class BorrowService {
  private base = `${environment.apiUrl}/borrows`;

  constructor(private http: HttpClient) { }

  private mapData<T>(res: any): T { return (res?.data ?? res) as T; }

  list(query?: Record<string, any>, page: number = 1, limit: number = 10): Observable<{ data: any[], meta: any }> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
      });
    }
    params = params.set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<any>(this.base, { params }).pipe(map(res => {
      return {
        data: this.mapData<any[]>(res),
        meta: res?.meta
      };
    }));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(res => this.mapData<any>(res)));
  }

  create(payload: {
    roomId: number;
    itemId?: number | null;
    quantity?: number;
    note?: string;
  }): Observable<any> {
    return this.http.post<any>(this.base, payload).pipe(map(res => this.mapData<any>(res)));
  }

  // Generic post action method: keeps the class small and consistent
  postAction(id: number, action: 'approve' | 'decline' | 'acquire' | 'cancel' | 'return' | 'accept-return', body?: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/${action}`, body || {}).pipe(map(res => this.mapData<any>(res)));
  }

  // Convenience wrappers
  approve(id: number) { return this.postAction(id, 'approve'); }
  decline(id: number, reason?: string) { return this.postAction(id, 'decline', { reason }); }
  acquire(id: number) { return this.postAction(id, 'acquire'); }
  cancel(id: number) { return this.postAction(id, 'cancel'); }
  markReturn(id: number) { return this.postAction(id, 'return'); }
  acceptReturn(id: number) { return this.postAction(id, 'accept-return'); }
}