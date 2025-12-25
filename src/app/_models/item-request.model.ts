export interface ItemRequestedEntry {
    id?:        number;  
    itemId?:    number | null;
    itemType?:  string | null;
    quantity?:  number;
    note?:      string | null;
    [key: string]: any;
  }
  
  export interface ItemRequestedInfo {
    kind?:      'inventory' | 'unit' | 'unknown' | null;
    type?:      string | null;
    inventory?: any | null;
    unit?:      any | null;
  }
  
  export interface ItemRequest {
    itemRequestId?:       number;
    id?:                  number;
    accountId?:          number;
    requesterRoomId?:     number | null;
    items?:               ItemRequestedEntry[];
    status?:              string; 
    note?:                string | null;
    createdAt?:           string | Date;
    updatedAt?:           string | Date;
    requestedItemsInfo?:  ItemRequestedInfo[] | null;
    [key: string]: any;
  }
  