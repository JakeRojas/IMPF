export interface Borrow {
  borrowId?: number;
  requesterId?: number;
  roomId?: number | string;
  itemType?: string;
  itemId?: number | string | null;
  quantity?: number;
  note?: string | null;
  status?: string;
  acquiredBy?: number | string | null;
  acquiredAt?: string | null;
  returnedBy?: number | string | null;
  returnedAt?: string | null;
  acceptedBy?: number | string | null;
  acceptedAt?: string | null;
  approvedBy?: number | string | null;
  declinedBy?: number | string | null;
  declineReason?: string | null;
  }