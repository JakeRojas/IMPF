export interface InventoryModel {
  id?:                      number;
  apparelInventoryId?:      number;
  adminSupplyInventoryId?:  number;
  genItemInventoryId?:      number;
  apparelName?:             string;
  supplyName?:              string;
  genItemName?:             string;
  roomId?:                  number;
  totalQuantity?:           number;
  supplyQuantity?:          number;
  quantity?:                number;
  [key: string]: any;
}

export interface UnitModel {
  id?:                      number;
  apparelInventoryId?:      number;
  adminSupplyInventoryId?:  number;
  genItemInventoryId?:      number;
  status?:                  string;
  roomId?:                  number;
  [key: string]: any;
}

export interface RequestedItem {
  kind:   'inventory' | 'unit' | 'unknown' | null;
  type?:  'apparel' | 'supply' | 'genitem' | string | null;
  inventory?: InventoryModel | null;
  unit?:      UnitModel | null;
}

export interface StockRequest {
  stockRequestId?:  number;
  id?:              number;
  accountId?:      number;
  requesterRoomId?: number | string;
  itemId?:          number | null;
  itemType?:        string | null;
  quantity?:        number;
  note?:            string;
  status?:          string;
  createdAt?:       string | Date;
  updatedAt?:       string | Date;
  requestedItem?:   RequestedItem | null;
  [key: string]: any;
}
