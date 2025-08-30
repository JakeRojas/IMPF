import { Injectable }                 from '@angular/core';
import { HttpClient, HttpResponse }   from '@angular/common/http';
import { environment }                from '@environments/environment';
import { Observable }                 from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QrService {
  private base = `${environment.apiUrl}/qr`;

  constructor(private http: HttpClient) {}

  getBatchQr(stockroomType: string, inventoryId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/${stockroomType}/${inventoryId}/qrcode`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
  getUnitQr(stockroomType: string, apparelId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/${stockroomType}/unit/${apparelId}/qrcode`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
  releaseUnit(stockroomType: string, apparelId: number, body: { actorId?: number } = {}): Observable<any> {
    return this.http.post<any>(`${this.base}/${stockroomType}/unit/${apparelId}/release`, body);
  }
  verifyQr(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/scan`, payload);
  }
}
