/**
 * Host bootstrap — mounts the Pharmacy Portal shell.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { loadRuntimeConfig } from '@/app/lib/load-runtime-config';
import '@/shared/styles/app.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

const mountNode = root;

async function boot(): Promise<void> {
  await loadRuntimeConfig();
  createRoot(mountNode).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void boot();
