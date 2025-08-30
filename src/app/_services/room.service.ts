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

  // ------------- APPAREL (existing) -------------
  // Inventory: apparel inventory aggregate for a room
  getInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/apparel-inventory`);
  }
  // Get received batches (apparel receive rows)
  getReceivedItems(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-apparels`);
  }
  // Get release batches
  getReleasedBatches(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/release-apparels`);
  }
  // Get unit items inside a room (Apparel units)
  getRoomItems(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/apparels`);
  }

  // Receive item in a room (apparel or supply or gen item)
  // backend handler will route depending on payload content.
  receiveItem(roomId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${roomId}/receive`, payload);
  }
  // helper: get specific apparel inventory row
  getInventoryById(roomId: number, inventoryId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/apparel-inventory/${inventoryId}`);
  }

  // Update an item's status (goods / damage) by QR or unitId
  updateItemStatus(roomId: number, itemQrCodeOrId: string | number, newStatus: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${roomId}/item/status`, { id: itemQrCodeOrId, status: newStatus });
  }

  // ------------- ADMIN/SUPPLY endpoints (NEW) -------------
  // supply inventory aggregate for a room
  getAdminSupplyInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/supply-inventory`);
  }
  // supply units in room
  getAdminSupplyUnits(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/supply`);
  }
  // received admin supply batches
  getReceiveAdminSupply(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-supply`);
  }

  // ------------- GENERAL / IT / MAINTENANCE (NEW) -------------
  // gen item inventory aggregate for a room
  getGenItemInventory(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/items-inventory`);
  }
  // gen item units in room
  getGenItemUnits(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/items`);
  }
  // received general item batches
  getReceiveGenItem(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-items`);
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
}
