import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@microfronts/ui';
import { formatMoney, type Cart, type RemoteProps } from '@microfronts/platform';
import './styles.css';

export default function CartApp({ platform }: RemoteProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError('');
    try {
      const next = await platform.request<Cart>('/cart', { signal: controller.signal });
      if (!controller.signal.aborted) setCart(next);
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Ошибка API'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [platform]);
  useEffect(() => {
    void refresh();
    const listener = () => { void refresh(); };
    const unsubscribe = platform.events.onCartChanged(listener);
    window.addEventListener('focus', listener);
    return () => { unsubscribe(); window.removeEventListener('focus', listener); request.current?.abort(); };
  }, [platform, refresh]);
  async function change(productId: string, quantity?: number) {
    setPending(true); setError('');
    try {
      await platform.request('/cart/items/' + encodeURIComponent(productId), {
        method: quantity === undefined ? 'DELETE' : 'PATCH',
        ...(quantity === undefined ? {} : { body: JSON.stringify({ quantity }) }),
      });
      platform.events.cartChanged();
    } catch (error) { setError(error instanceof Error ? error.message : 'Ошибка API'); }
    finally { setPending(false); }
  }
  return <section className="cart" aria-label="Корзина">
    <div className="cart-title"><Badge tone="amber">cart</Badge><p>Корзина живет отдельно от каталога.</p></div>
    <Button onClick={() => void refresh()} disabled={loading}>Обновить корзину</Button>
    {loading && <p role="status">Обновляем корзину…</p>}
    {error && <p role="alert">{error}</p>}
    {cart && cart.items.length === 0 && <p>Корзина пуста</p>}
    <div className="cart-list">{cart?.items.map((item) => <div className="cart-row" key={item.productId}>
      <div><strong>{item.title}</strong><span>Количество: {item.quantity}</span>
        <div className="cart-actions">
          <Button aria-label={'Уменьшить ' + item.title} disabled={pending || item.quantity <= 1} onClick={() => void change(item.productId, item.quantity - 1)}>−</Button>
          <Button aria-label={'Увеличить ' + item.title} disabled={pending || item.quantity >= 99} onClick={() => void change(item.productId, item.quantity + 1)}>+</Button>
          <Button disabled={pending} onClick={() => void change(item.productId)}>Удалить</Button>
        </div>
      </div><b>{formatMoney(item.priceMinor * item.quantity, cart.currency)}</b>
    </div>)}</div>
    {cart && <footer className="cart-total"><span>Итого</span><strong>{formatMoney(cart.totalMinor, cart.currency)}</strong></footer>}
  </section>;
}
