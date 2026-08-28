# Правила cart-репозитория

Это отдельный репозиторий команды корзины. Команда не зависит от shell и не должна импортировать его код.

## Границы

- Cart запускается standalone на `http://localhost:5175`.
- Cart отдает `remoteEntry.js` для shell.
- Публичный модуль: `cart/CartApp`.
- Контракт с shell - это exposed module, URL remote и договоренная форма интеграции.

## Команды

- `npm install` - установить зависимости cart.
- `npm run dev` - запустить standalone/dev remote на `http://localhost:5175`.
- `npm run dev:remote` - то же самое, явное имя для запуска из shell.
- `npm run typecheck` - проверить TypeScript.
- `npm run build` - собрать cart.

## Shared UI

В учебном стенде `@microfronts/ui` подключен через `file:../../packages/ui`. В реальном проекте команда ставит опубликованную версию из npm registry.

