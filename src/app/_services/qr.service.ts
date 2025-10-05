import { Injectable }                 from '@angular/core';
import { HttpClient, HttpResponse }   from '@angular/common/http';
import { environment }                from '@environments/environment';
import { Observable }                 from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QrService {
  private base = `${environment.apiUrl}/qr`;

  constructor(private http: HttpClient) {}

  // getBatchQr(stockroomType: string, inventoryId: number): Observable<HttpResponse<Blob>> {
  //   return this.http.get(`${this.base}/${stockroomType}/${inventoryId}/qrcode`, {
  //     observe: 'response',
  //     responseType: 'blob'
  //   });
  // }
  releaseUnit(stockroomType: string, apparelId: number, body: { actorId?: number } = {}): Observable<any> {
    return this.http.post<any>(`${this.base}/${stockroomType}/unit/${apparelId}/release`, body);
  }
  verifyQr(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/scan`, payload);
  }
  updateUnitStatus(stockroomType: string, unitId: number, body: { status: string }) {
    return this.http.put<any>(`${this.base}/${stockroomType}/unit/${unitId}/status`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  getUnitQr(stockroomType: string, unitId: number) {
    return this.http.get(`${this.base}/${stockroomType}/unit/${unitId}/qrcode`, { responseType: 'blob' });
  }
  getBatchQr(stockroomType: string, inventoryId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${stockroomType}/${inventoryId}/qrcode`, { responseType: 'blob' });
  }

  // download server-generated PDF with all QR codes for a room
  downloadAllPdf(stockroomType: string, roomId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${stockroomType}/room/${roomId}/pdf-all`, { responseType: 'blob' });
  }
}
