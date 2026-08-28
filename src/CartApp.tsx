import { Badge } from "@microfronts/ui";
import "./styles.css";

type CartItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
};

const cartItems: CartItem[] = [
  { productId: "keyboard", title: "Split keyboard", price: 149, quantity: 1 },
  { productId: "dock", title: "USB-C dock", price: 119, quantity: 2 }
];

const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

export default function CartApp() {
  return (
    <div className="cart">
      <div className="remote-title">
        <Badge tone="amber">cart</Badge>
        <p>Корзина живет отдельно от каталога.</p>
      </div>

      <div className="cart-list">
        {cartItems.map((item) => (
          <div className="cart-row" key={item.productId}>
            <div>
              <strong>{item.title}</strong>
              <span>Qty: {item.quantity}</span>
            </div>
            <b>${item.price * item.quantity}</b>
          </div>
        ))}
      </div>

      <footer className="cart-total">
        <span>Total</span>
        <strong>${total}</strong>
      </footer>
    </div>
  );
}
