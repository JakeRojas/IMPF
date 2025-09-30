// // src/app/_models/inventory.model.ts
// export interface InventoryItem {
//     apparelInventoryId?: number;
//     adminSupplyInventoryId?: number;
//     genItemInventoryId?: number;
//     id?: number;
//     name?: string;
//     totalQuantity?: number;
//     quantity?: number;
//     supplyMeasure?: string;
//     size?: string;
//     status?: string;
//     createdAt?: string;
//     [key: string]: any;
//   }
  
//   export interface ReceivePayload {
//     // apparel specific
//     apparelName?: string;
//     apparelLevel?: string;
//     apparelType?: string;
//     apparelFor?: string;
//     apparelSize?: string;
//     apparelQuantity?: number;
  
//     // admin supply
//     supplyName?: string;
//     supplyQuantity?: number;
//     supplyMeasure?: string;
  
//     // general item
//     genItemName?: string;
//     genItemQuantity?: number;
//     genItemType?: string;
//     genItemSize?: string;
  
//     // common
//     receivedFrom?: string;
//     receivedBy?: number;
//     notes?: string;
//   }
  
//   export interface ReleasePayload {
//     apparelInventoryId?: number;
//     adminSupplyInventoryId?: number;
//     genItemInventoryId?: number;
//     releaseQuantity?: number;
//     releasedBy?: string|number;
//     claimedBy?: string|number;
//     remarks?: string;
//   }
  

export interface BaseReceivePayload {
    receivedFrom?: string;
    receivedBy?: number; // accountId
    notes?: string;
  }
  
  export interface ApparelReceivePayload extends BaseReceivePayload {
    apparelName: string;
    apparelLevel: string;
    apparelType: string;
    apparelFor: string;
    apparelSize: string;
    apparelQuantity: number;
  }
  
  export interface SupplyReceivePayload extends BaseReceivePayload {
    supplyName: string;
    supplyType?: string;
    supplyMeasure?: string;
    supplyQuantity: number;
  }
  
  export interface GenItemReceivePayload extends BaseReceivePayload {
    genItemName: string;
    genItemType?: string;
    genItemSize?: string;
    genItemQuantity: number;
  }
  
  // Optional: API response type
  export interface ReceiveResult {
    success: boolean;
    message?: string;
    createdId?: number;
  }