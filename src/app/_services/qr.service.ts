import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QrService {
  private base = `${environment.apiUrl}/qr`;

  constructor(private http: HttpClient) { }

  releaseUnit(stockroomType: string, unitId: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${stockroomType}/unit/${unitId}/release`, body);
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

  downloadSelectedUnitsPdf(stockroomType: string, unitIds: number[]): Observable<Blob> {
    return this.http.post(`${this.base}/${stockroomType}/units/pdf-selected`, { unitIds }, { responseType: 'blob' });
  }

  downloadAllPdf(stockroomType: string, roomId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${stockroomType}/room/${roomId}/pdf-all`, { responseType: 'blob' });
  }
  downloadAllUnitsPdf(stockroomType: string, roomId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${stockroomType}/room/${roomId}/pdf-units`, { responseType: 'blob' });
  }
}
