export interface CartItem {
  productId: string;
  title: string;
  priceMinor: number;
  quantity: number;
}
export interface Cart {
  items: CartItem[];
  totalMinor: number;
  currency: string;
  revision: number;
}
