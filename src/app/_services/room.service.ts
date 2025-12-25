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
  listRooms() { 
    return this.http.get<any[]>(`${this.baseUrl}/list`); 
  }
  getItemsByRoom(roomId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/${roomId}/room-items`);
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
    // determine type from payload (prefer explicit fields)
    if (payload.apparelName) {
      return this.http.post<any>(`${this.baseUrl}/${roomId}/receive/apparel`, payload);
    } else if (payload.supplyName) {
      return this.http.post<any>(`${this.baseUrl}/${roomId}/receive/supply`, payload);
    } else {
      return this.http.post<any>(`${this.baseUrl}/${roomId}/receive/item`, payload);
    }
  }

  // APPAREL
  getApparelInventory(roomId: number)       { return this.http.get<any>(`${this.baseUrl}/${roomId}/apparel-inventory`); }
  getReceivedBatchApparels(roomId: number)  { return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-apparels`); }
  getReleasedBatchApparels(roomId: number)  { return this.http.get<any>(`${this.baseUrl}/${roomId}/release-apparels`); }
  getApparelUnits(roomId: number)           { return this.http.get<any>(`${this.baseUrl}/${roomId}/apparels`); }

  // ADMIN / SUPPLY
  getAdminSupplyInventory(roomId: number)     { return this.http.get<any>(`${this.baseUrl}/${roomId}/supply-inventory`); }
  getReceivedBatchAdminSupply(roomId: number) { return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-supply`); }
  getReleasedBatchAdminSupply(roomId: number) { return this.http.get<any>(`${this.baseUrl}/${roomId}/release-supply`); }
  getAdminSupplyUnits(roomId: number)         { return this.http.get<any>(`${this.baseUrl}/${roomId}/supply`); }

  // GENERAL / ITEMS
  getGenItemInventory(roomId: number)     { return this.http.get<any>(`${this.baseUrl}/${roomId}/items-inventory`); }
  getReceivedBatchGenItem(roomId: number) { return this.http.get<any>(`${this.baseUrl}/${roomId}/receive-items`); }
  getReleasedBatchGenItem(roomId: number) { return this.http.get<any>(`${this.baseUrl}/${roomId}/release-items`); }
  getGenItemUnits(roomId: number)         { return this.http.get<any>(`${this.baseUrl}/${roomId}/items`); }

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
    const body: any = { ...payload };
  
    // backend (server) expects releaseApparelQuantity — support both shortcut field names
    if (body.releaseQuantity != null && body.releaseApparelQuantity == null) {
      body.releaseApparelQuantity = Number(body.releaseQuantity);
      // delete(body.releaseQuantity); // optional
    }
  
    // ensure numeric fields are numbers (server normalizes but it's good to be explicit)
    if (body.releaseApparelQuantity != null) body.releaseApparelQuantity = Number(body.releaseApparelQuantity);
    if (body.apparelInventoryId != null) body.apparelInventoryId = Number(body.apparelInventoryId);
  
    // NOTE: backend route for apparel release is /rooms/:roomId/release/apparel
    return this.http.post<any>(`${this.baseUrl}/${roomId}/release/apparel`, body);
  }
  releaseAdminSupply(roomId: number, payload: any): Observable<any> {
    // make a shallow copy so we don't mutate callers' objects
    const body: any = { ...payload };
  
    // backend (server) expects releaseApparelQuantity — support both shortcut field names
    if (body.releaseQuantity != null && body.releaseAdminSupplyQuantity == null) {
      body.releaseAdminSupplyQuantity = Number(body.releaseQuantity);
      // delete(body.releaseQuantity); // optional
    }
  
    // ensure numeric fields are numbers (server normalizes but it's good to be explicit)
    if (body.releaseAdminSupplyQuantity != null) body.releaseAdminSupplyQuantity = Number(body.releaseAdminSupplyQuantity);
    if (body.adminSupplyInventoryId != null) body.adminSupplyInventoryId = Number(body.adminSupplyInventoryId);
  
    // NOTE: backend route for apparel release is /rooms/:roomId/release/apparel
    return this.http.post<any>(`${this.baseUrl}/${roomId}/release/supply`, body);
  }
  // releaseGenItem(roomId: number, payload: any): Observable<any> {
  //   // make a shallow copy so we don't mutate callers' objects
  //   const body: any = { ...payload };
  
  //   // backend (server) expects releaseApparelQuantity — support both shortcut field names
  //   if (body.releaseQuantity != null && body.releaseItemQuantity == null) {
  //     body.releaseItemQuantity = Number(body.releaseQuantity);
  //     // delete(body.releaseQuantity); // optional
  //   }
  
  //   // ensure numeric fields are numbers (server normalizes but it's good to be explicit)
  //   if (body.releaseItemQuantity != null) body.releaseItemQuantity = Number(body.releaseItemQuantity);
  //   if (body.genItemInventoryId != null) body.genItemInventoryId = Number(body.genItemInventoryId);
  
  //   // NOTE: backend route for apparel release is /rooms/:roomId/release/apparel
  //   return this.http.post<any>(`${this.baseUrl}/${roomId}/release/item`, body);
  // }
  releaseGenItem(roomId: number, payload: any) {
    // normalize fields the backend expects
    const body: any = { ...payload };          // spread payload
    // ensure numeric
    body.releaseItemQuantity = Number(body.releaseQuantity ?? body.releaseItemQuantity ?? 0);
    // map UI remarks -> backend notes
    if (body.remarks && !body.notes) body.notes = body.remarks;
    // remove redundant fields if you like
    delete body.releaseQuantity;
    delete body.remarks;
  
    return this.http.post(`${this.baseUrl}/${roomId}/release/item`, body);
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
