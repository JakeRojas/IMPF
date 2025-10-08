export interface BaseReceivePayload {
    receivedFrom?:  string;
    receivedBy?:    number;
    notes?:         string;
  }
  
  export interface ApparelReceivePayload extends BaseReceivePayload {
    apparelName:      string;
    apparelLevel:     string;
    apparelType:      string;
    apparelFor:       string;
    apparelSize:      string;
    apparelQuantity:  number;
  }
  
  export interface SupplyReceivePayload extends BaseReceivePayload {
    supplyName:     string;
    supplyType?:    string;
    supplyMeasure?: string;
    supplyQuantity: number;
  }
  
  export interface GenItemReceivePayload extends BaseReceivePayload {
    genItemName:      string;
    genItemType?:     string;
    genItemSize?:     string;
    genItemQuantity:  number;
  }
  
  // Optional: API response type
  export interface ReceiveResult {
    success:    boolean;
    message?:   string;
    createdId?: number;
  }