import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKey as sharedCartKey } from "@microfronts/contracts";
import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@microfronts/ui";
import { formatMoney, request as apiRequest } from "./api";
import type { CartProps } from "./remote-props";
import type { Cart } from "./models";
import "./app/styles/tailwind.css";
import "./app/styles/remote.css";

export default function CartApp(props: CartProps) {
  const [localClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={props.queryClient ?? localClient}><CartContent {...props} /></QueryClientProvider>;
}
function CartContent({ apiBaseUrl, cartKey, sessionScope, onUnauthorized, refreshVersion = 0 }: CartProps) {
  const client = useQueryClient();
  const scope = sessionScope ?? 'guest:' + cartKey;
  const key = sharedCartKey(apiBaseUrl, scope);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => apiRequest<Cart>(apiBaseUrl, cartKey, '/cart', { signal }, sessionScope, onUnauthorized),
    staleTime: 30000, retry: false,
  });
  // Compatibility with v2 hosts while remotes are rolled out before Shell.
  const previousVersion = useRef(refreshVersion);
  useEffect(() => {
    if (previousVersion.current !== refreshVersion) {
      previousVersion.current = refreshVersion;
      void client.invalidateQueries({ queryKey: sharedCartKey(apiBaseUrl, scope) });
    }
  }, [refreshVersion, client, apiBaseUrl, scope]);
  const mutation = useMutation({
    mutationKey: ['cart-write', apiBaseUrl, scope],
    scope: { id: 'cart:' + scope }, retry: false,
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) => apiRequest<Cart>(apiBaseUrl, cartKey, '/cart/items/' + encodeURIComponent(productId), {
      method: quantity === undefined ? 'DELETE' : 'PATCH',
      ...(quantity === undefined ? {} : { body: JSON.stringify({ quantity }) }),
    }, sessionScope, onUnauthorized),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: key }); },
  });
  const cart = query.data;
  const pending = mutation.isPending;
  const loading = query.isFetching;
  const error = query.error?.message ?? mutation.error?.message;
  const refresh = () => query.refetch();
  function change(productId: string, quantity?: number) { mutation.mutate({ productId, quantity }); }
  return (
    <section className="cart cart:grid cart:gap-[18px]" aria-label="Корзина">
      <div className="cart-title">
        <Badge tone="amber">cart</Badge>
        <p>Корзина живет отдельно от каталога.</p>
      </div>
      <Button onClick={() => void refresh()} disabled={loading}>
        Обновить корзину
      </Button>
      {loading && <p role="status">Обновляем корзину…</p>}
      {error && <p role="alert">{error}</p>}
      {cart && cart.items.length === 0 && <p>Корзина пуста</p>}
      <div className="cart-list">
        {cart?.items.map((item) => (
          <div className="cart-row" key={item.productId}>
            <div>
              <strong>{item.title}</strong>
              <span>Количество: {item.quantity}</span>
              <div className="cart-actions">
                <Button
                  aria-label={"Уменьшить " + item.title}
                  disabled={pending || item.quantity <= 1}
                  onClick={() => void change(item.productId, item.quantity - 1)}
                >
                  −
                </Button>
                <Button
                  aria-label={"Увеличить " + item.title}
                  disabled={pending || item.quantity >= 99}
                  onClick={() => void change(item.productId, item.quantity + 1)}
                >
                  +
                </Button>
                <Button disabled={pending} onClick={() => void change(item.productId)}>
                  Удалить
                </Button>
              </div>
            </div>
            <b>{formatMoney(item.priceMinor * item.quantity, cart.currency)}</b>
          </div>
        ))}
      </div>
      {cart && (
        <footer className="cart-total">
          <span>Итого</span>
          <strong>{formatMoney(cart.totalMinor, cart.currency)}</strong>
        </footer>
      )}
    </section>
  );
}
