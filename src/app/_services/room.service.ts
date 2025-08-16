import { Injectable }       from '@angular/core';
import { Router }           from '@angular/router';
import { HttpClient }       from '@angular/common/http';
import { Observable }       from 'rxjs';
import { map }              from 'rxjs/operators';

import { environment }      from '@environments/environment';
import { Room }             from '@app/_models/room';

const baseUrl = `${environment.apiUrl}/rooms`;

@Injectable({ providedIn: 'root' })
export class RoomService {
    constructor(private http: HttpClient) { }

    getRooms(): Observable<Room[]> {
        return this.http.get<Room[]>(baseUrl);
    }

    getRoomById(roomId: number) {
        return this.http.get<Room>(`${baseUrl}/${roomId}`);
    }

    createRoom(room: any) {
        return this.http.post(`${baseUrl}/create-room`, room);
    }

    updateRoom(roomId: number, room: any) {
        return this.http.put(`${baseUrl}/${roomId}`, room);
    }

    // updateApparel(id: string, params: {
    //     ReceiveApparelId?:   number;
    //     receivedFrom?:       Account[];
    //     receivedBy?:         string;
    //     releasedBy?:         string;
    //     apparelName?:        string;
    //     apparelLevel?:       string;
    //     apparelType?:        string;
    //     apparelFor?:         string;
    //     apparelSize?:        string;
    //     apparelQuantity?:    string;
    // }): Observable<any> {
    //     return this.http.put(`${baseUrl}/${id}`, params);
    // }

    // deactivateProduct(id: string): Observable<any> {
    //     return this.http.put(`${baseUrl}/${id}/deactivateProduct`, {});
    // }

    // reactivateProduct(id: string): Observable<any> {
    //     return this.http.put(`${baseUrl}/${id}/reactivateProduct`, {});
    // }

    // checkAvailability(productId: string): Observable<{
    //     product: string;
    //     available: boolean;
    //     quantity: number;
    // }> {
    //     return this.http.get<{
    //         product: string;
    //         available: boolean;
    //         quantity: number;
    //     }>(`${baseUrl}/${productId}/availability`);
    // }

    // delete(id: string): Observable<any> {
    //     return this.http.delete(`${baseUrl}/${id}`);
    // }
}