import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatform } from '@microfronts/platform';
import CartApp from './CartApp';
import './standalone.css';
const root = createRoot(document.getElementById('root')!);
fetch('/runtime-config.json', { cache: 'no-store' }).then(async (response) => {
  if (!response.ok) throw new Error('Не удалось загрузить настройки');
  const config = await response.json();
  if (config.schemaVersion !== 1 || typeof config.apiBaseUrl !== 'string') throw new Error('Неверный runtime config');
  const platform = createPlatform(config);
  root.render(<StrictMode><main className="remote-page"><p>Standalone cart · API: {config.apiBaseUrl}</p><CartApp platform={platform} /></main></StrictMode>);
}).catch((error: Error) => root.render(<p role="alert">{error.message}</p>));
