import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '@environments/environment';
import { Observable }   from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private baseUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  // Rooms CRUD
  getRooms() { 
    return this.http.get<any[]>(this.baseUrl); 
  }
  getRoomById(roomId: number) { 
    return this.http.get<any>(`${this.baseUrl}/${roomId}`); 
  }
  createRoom(room: any) { 
    return this.http.post(`${this.baseUrl}/create-room`, room); 
  }
  updateRoom(roomId: number, room: any) { 
    return this.http.put(`${this.baseUrl}/${roomId}`, room); 
  }

  // ------------- Receive Any types of item -------------
  receiveItem(roomId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${roomId}/receive`, payload);
  }

  // ------------- APPAREL -------------
  getApparelInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/apparel-inventory`);
  }
  getReceivedBatchApparels(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-apparels`);
  }
  getReleasedBatchAppparel(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/release-apparels`);
  }
  getApparelUnits(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/apparels`);
  }

  // ------------- ADMIN/SUPPLY -------------
  getAdminSupplyInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/supply-inventory`);
  }
  getReceivedBatchAdminSupply(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-supply`);
  }
  getReleasedBatchAdminSupply(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/release-supply`);
  }
  getAdminSupplyUnits(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/supply`);
  }

  // ------------- GENERAL / IT / MAINTENANCE (NEW) -------------
  getGenItemInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/items-inventory`);
  }
  getReceivedBatchGenItem(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-items`);
  }
  getGenItemUnits(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/items`);
  }
  getReleasedBatchGenItem(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/release-gen-item`);
  }

  // ------------- Room-scoped QR endpoints (return PNG blobs) -------------
  // Apparel
  getApparelBatchQr(roomId: number, inventoryId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/apparel/batch/${inventoryId}`, { responseType: 'blob' });
  }
  getApparelUnitQr(roomId: number, unitId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/apparel/unit/${unitId}`, { responseType: 'blob' });
  }
  // Admin supply
  getAdminSupplyBatchQr(roomId: number, inventoryId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/admin-supply/batch/${inventoryId}`, { responseType: 'blob' });
  }
  getAdminSupplyUnitQr(roomId: number, unitId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/admin-supply/unit/${unitId}`, { responseType: 'blob' });
  }
  // Gen / items
  getGenItemBatchQr(roomId: number, inventoryId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/general-item/batch/${inventoryId}`, { responseType: 'blob' });
  }
  getGenItemUnitQr(roomId: number, unitId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${roomId}/qr/general-item/unit/${unitId}`, { responseType: 'blob' });
  }

  // Get list of in-charge accounts (used to populate receivedBy/releasedBy fields)
  getInChargeOptions(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/accounts`); // filter client-side if needed
  }

  releaseApparel(roomId: number, payload: any): Observable<any> {
    // make a shallow copy so we don't mutate callers' objects
    const body = { ...payload };
  
    // backend expects releaseApparelQuantity (room.service.releaseApparelInRoomHandler)
    if (body.releaseQuantity != null && body.releaseApparelQuantity == null) {
      body.releaseApparelQuantity = body.releaseQuantity;
      // optional: delete body.releaseQuantity; // not required but clearer
    }
  
    // backend route is /rooms/:roomId/release/apparel
    return this.http.post<any>(`${this.baseUrl}/${roomId}/release`, body);
  }

  updateApparelStatus(roomId: number, apparelId: number, newStatus: string) {
    return this.http.put(`${this.baseUrl}/${roomId}/apparels/${apparelId}/status`, { status: newStatus });
  }
  
  updateAdminSupplyStatus(roomId: number, supplyId: number, newStatus: string) {
    return this.http.put(`${this.baseUrl}/${roomId}/admin-supplies/${supplyId}/status`, { status: newStatus });
  }
  
  updateGenItemStatus(roomId: number, genItemId: number, newStatus: string) {
    return this.http.put(`${this.baseUrl}/${roomId}/gen-items/${genItemId}/status`, { status: newStatus });
  }
}
