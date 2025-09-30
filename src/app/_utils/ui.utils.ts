export type StockroomType = 'apparel' | 'supply' | 'general';

export function isApparel(type?: string): boolean {
  return type === 'apparel';
}
export function isSupply(type?: string): boolean {
  return type === 'supply' || type === 'adminSupply';
}
export function isGeneral(type?: string): boolean {
  return type === 'general' || type === 'genitem' || !type;
}

/**
 * Unified getters for different inventory/transaction shapes.
 * You can extend these if your backend uses other property names.
 */
export function itemName(item: any, stockroomType?: StockroomType): string {
  if (!item) return '';
  if (isApparel(stockroomType)) return item.apparelName  || '';
  if (isSupply(stockroomType))  return item.supplyName  || '';
  return item.genItemName || '';
}

export function itemQuantity(item: any, stockroomType?: StockroomType): number {
  if (!item) return 0;
  if (isApparel(stockroomType)) return item.apparelQuantity ?? item.quantity ?? item.totalQuantity ?? 0;
  if (isSupply(stockroomType))  return item.supplyQuantity ?? item.quantity ?? item.totalQuantity ?? 0;
  return item.genItemQuantity ?? item.quantity ?? item.totalQuantity ?? 0;
}