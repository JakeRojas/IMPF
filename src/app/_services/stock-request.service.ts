// // // import { Injectable } from '@angular/core';
// // // import { HttpClient } from '@angular/common/http';
// // // import { environment }  from '@environments/environment';
// // // import { Observable } from 'rxjs';

// // // //const API = '/req-stock'; // backend route (server.js mounts: /req-stock). See backend controller. :contentReference[oaicite:8]{index=8}

// // // @Injectable({ providedIn: 'root' })
// // // export class StockRequestService {
// // //   private baseUrl = `${environment.apiUrl}/req-stock`;

// // //   constructor(private http: HttpClient) {}

// // //   list()/* (params?: any): Observable<any> */ {
// // //     // optional params: { status, acccountId }
// // //     return this.http.get<any[]>(this.baseUrl);
// // //   }

// // //   getById(id: number) {
// // //     return this.http.get(`${this.baseUrl}/${id}`);
// // //   }

// // //   create(payload: any) {
// // //     return this.http.post(`${this.baseUrl}`, payload);
// // //   }

// // //   approve(id: number) {
// // //     return this.http.post(`${this.baseUrl}/${id}/approve`, {});
// // //   }

// // //   disapprove(id: number, reason?: string) {
// // //     return this.http.post(`${this.baseUrl}/${id}/disapprove`, { reason });
// // //   }

// // //   fulfill(id: number) {
// // //     return this.http.post(`${this.baseUrl}/${id}/fulfill`, {});
// // //   }
// // // }


// // import { Injectable } from '@angular/core';
// // import { HttpClient } from '@angular/common/http';
// // import { Observable, throwError } from 'rxjs';
// // import { catchError, map } from 'rxjs/operators';
// // import { environment }  from '@environments/environment';
// // import { StockRequest } from '../_models/stock-request.model';

// // //const API = '/req-stock';

// // @Injectable({ providedIn: 'root' })
// // export class StockRequestService {
// //   private baseUrl = `${environment.apiUrl}/req-stock`;
// //   constructor(private http: HttpClient) {}

// //   list(): Observable<StockRequest[]> {
// //     return this.http.get<any>(this.baseUrl).pipe(
// //       map(res => res?.data ?? res ?? []),
// //       catchError(err => { console.error('GET /req-stock failed', err); return throwError(() => err); })
// //     );
// //   }

// //   // getById(stockRequestId: number): Observable<StockRequest | null> {
// //   //   return this.http.get<any>(`${this.baseUrl}/${stockRequestId}`).pipe(
// //   //     map(res => res?.data ?? res ?? null),
// //   //     catchError(err => { console.error(`GET ${this.baseUrl}/${stockRequestId} failed`, err); return throwError(() => err); })
// //   //   );
// //   // }
// //   getById(stockRequestId: number) { 
// //     return this.http.get<any>(`${this.baseUrl}/${stockRequestId}`); 
// //   }

// //   create(payload: any) { return this.http.post<any>(this.baseUrl, payload); }
// //   approve(id: number) { return this.http.post<any>(`${this.baseUrl}/${id}/approve`, {}); }
// //   disapprove(id: number, reason?: string) { return this.http.post<any>(`${this.baseUrl}/${id}/disapprove`, { reason }); }
// //   fulfill(id: number) { return this.http.post<any>(`${this.baseUrl}/${id}/fulfill`, {}); }
// // }


// // src/app/_services/stock-request.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '@environments/environment';
// import { Observable, throwError  } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class StockRequestService {
//   private base = `${environment.apiUrl}/req-stock`;

//   constructor(private http: HttpClient) {}

//   list(params: any = {}): Observable<any> {
//     return this.http.get<any>(this.base, { params });
//   }

//   // get(id: number): Observable<any> {
//   //   return this.http.get<any>(`${this.base}/${id}`);
//   // }
//   get(stockRequestId: any): Observable<any> {
//     const numeric = Number(stockRequestId);
//     if (!Number.isFinite(numeric) || numeric <= 0) {
//       // return a failed observable so the caller can handle it
//       return throwError(() => 'Invalid stock request id');
//     }
//     return this.http.get<any>(`${this.base}/${numeric}`);
//   }

//   create(payload: any): Observable<any> {
//     return this.http.post<any>(this.base, payload);
//   }

//   approve(id: number): Observable<any> {
//     return this.http.post<any>(`${this.base}/${id}/approve`, {});
//   }

//   disapprove(id: number, reason?: string): Observable<any> {
//     return this.http.post<any>(`${this.base}/${id}/disapprove`, { reason });
//   }

//   fulfill(id: number): Observable<any> {
//     return this.http.post<any>(`${this.base}/${id}/fulfill`, {});
//   }
// }





// src/app/_services/stock-request.service.ts
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
    return this.http.post<any>(this.base, payload);
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
