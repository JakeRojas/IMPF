export interface TransferItem {
    itemType?:  'apparel' | 'supply' | 'genItem' | string;
    itemId?:    number | null;
    quantity?:  number;
    note?:      string | null;
    [key: string]: any;
  }
  
  export interface Transfer {
    transferId?:  number;
    fromRoomId?:  number;
    toRoomId?:    number;
    createdBy?:   number;
    createdAt?:   string;
    status?:      string; 
    items?:       TransferItem[];
    note?:        string | null;
    [key: string]: any;
  }
  