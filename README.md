# @microfronts/cart

Архитектура и правила FSD: [docs/architecture.md](docs/architecture.md). Процесс выполнения задач: [AGENTS.md](AGENTS.md).

Отдельный Git-репозиторий React 19 + Vite + Module Federation. Установка не требует соседних исходников: готовый UI находится в vendor. Связь микрофронтов — через props, навигационные callbacks и общий TanStack QueryClient; пакет platform не требуется. Контракт поставляется архивом @microfronts/contracts в vendor.

```powershell
npm ci
npm run dev
```

Открыть http://localhost:5175.
Это standalone-приложение: Shell для запуска не требуется. По умолчанию нужен backend на 3000.

Скопируйте .env.example в .env.local. API_PROXY_TARGET выбирает backend для локального /api proxy. Для публичной сборки задайте HTTPS-переменные из примера. Настройки передаются через runtime-config.json.

## Локальная разработка с API в Railway

Чтобы работать над корзиной без локального backend, создайте `.env.local`:

```dotenv
VITE_API_BASE_URL=/api
API_PROXY_TARGET=https://microfronts-api-production-f9c3.up.railway.app
```

Затем запустите `npm run dev` и откройте `http://localhost:5175`.
Vite проксирует `/api/cart` в Railway, сохраняя `/api` в пути. У `API_PROXY_TARGET` указывается только origin backend, без `/api`.

Важно задать **обе** переменные: если в `.env` уже есть абсолютный `VITE_API_BASE_URL`, один `API_PROXY_TARGET` его не заменит. Браузер продолжит обращаться напрямую в облако, обходя proxy, и может получить CORS-ошибку. `.env.local` переопределяет `.env`; переменные процесса и env-файлы выбранного режима тоже могут влиять на результат. После изменения перезапустите dev server и проверьте `http://localhost:5175/runtime-config.json`: должно быть `"apiBaseUrl": "/api"`.

Для локального backend оставьте `VITE_API_BASE_URL=/api`, а `API_PROXY_TARGET` замените на `http://localhost:3000` и отдельно запустите backend. Команда `npm run dev` в cart запускает только фронтенд.

`.env.local` не коммитится. На Vercel задавайте полный `VITE_API_BASE_URL=https://microfronts-api-production-f9c3.up.railway.app/api` в окружении сборки, а `VITE_PUBLIC_BASE` — публичный адрес cart с завершающим `/`. Локальную базу `/api` нельзя переносить в статический облачный деплой без отдельного reverse proxy.

Для Vercel Preview задайте `VITE_API_BASE_URL` отдельно. Адрес самого Preview-деплоя сборка получает из системного `VERCEL_URL`, когда `VITE_PUBLIC_BASE` не задан. Preview-домену также нужен доступ к API по CORS; проверьте его перед использованием авторизованных сценариев.

Команды: npm run typecheck, npm run build (cloud), npm run build:local (localhost), npm run preview. Preview использует порт 4175. Общая сборка и тесты стенда находятся в отдельном integration-репозитории.

Exposed module: cart/CartApp. Props из @microfronts/contracts: apiBaseUrl, cartKey, queryClient, sessionScope, onUnauthorized, onNavigate. Общий клиент создаёт Shell. Standalone создаёт свой клиент и отправляет гостевые запросы без cookies. Старые refreshVersion сохранены для совместимости host. CreateRoot вызывается только в standalone main.tsx.

Для Render используйте render.yaml; для Docker Compose — Dockerfile и nginx.conf (он ожидает сервис backend:3000). vendor и package-lock.json коммитятся, node_modules/dist/.env — нет.

Текущий backend хранит пользователей, сессии и корзины в PostgreSQL. Разные origins имеют разные анонимные ключи корзины. Интеграционный стенд и его инструкции находятся в отдельном репозитории.

Обновляйте backend, Shell и remote согласованным комплектом: новый backend требует X-Requested-With для мутаций, новые remote его отправляют. Новому Shell нужны remote с поддержкой sessionScope. Zustand пока не используется.

## Tailwind и владение CSS

Tailwind 4 и @tailwindcss/vite установлены как devDependencies: каждый репозиторий собирает свой CSS, в federation.shared они не входят. Поддерживаются Chrome 111+, Safari 16.4+ и Firefox 128+.

Файл src/app/styles/tailwind.css сканирует только собственный src и использует префикс `cart:`: например, `cart:flex`, `cart:hover:bg-blue-600`. Записывайте классы целиком, не собирайте имена интерполяцией. Исходники соседей и UI-пакета не сканируются.

Exposed-компонент импортирует Tailwind и remote.css, поэтому стили доступны и внутри Shell. Reset @microfronts/ui/reset.css импортируется только в src/main.tsx для standalone и не входит в граф exposed-модуля. Глобальные стили страницы остаются в standalone.css.

UI-пакет 0.2.0-tailwind.0 из vendor автоматически поставляет готовые стили компонентов без Preflight и глобальных правил base. Его reset.css содержит Preflight и базовые правила темы. Во всех сборках порядок слоёв: theme, base, components, utilities. Префиксы не изолируют произвольный CSS: ручные правила ограничивайте корнем remote или CSS Modules. Оставшиеся правила без слоя имеют приоритет над utilities; при миграции удаляйте заменённые декларации.

Порядок выпуска: сначала Shell с явным reset, затем remote с CSS без reset. Архивы vendor и lock-файлы обновляются вместе; зависимости на соседние checkout не добавляются.
