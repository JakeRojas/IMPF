// src/app/_models/item-request.model.ts
export interface ItemRequestedEntry {
    id?: number;           // optional row id in item request
    itemId?: number | null;
    itemType?: string | null; // e.g. 'apparel'|'supply'|'genItem'
    quantity?: number;
    note?: string | null;
    [key: string]: any;
  }
  
  export interface ItemRequestedInfo {
    kind?: 'inventory' | 'unit' | 'unknown' | null;
    type?: string | null;
    inventory?: any | null;
    unit?: any | null;
  }
  
  export interface ItemRequest {
    itemRequestId?: number;
    id?: number;
    acccountId?: number;
    requesterRoomId?: number | string | null;
    items?: ItemRequestedEntry[];          // list of requested entries
    status?: string;                       // 'pending'|'accepted'|'declined'|'fulfilled'
    note?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    requestedItemsInfo?: ItemRequestedInfo[] | null; // additional details loaded from backend for each item
    [key: string]: any;
  }
  