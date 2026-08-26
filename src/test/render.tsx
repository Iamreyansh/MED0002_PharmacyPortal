import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { App } from '@/app/App';
import type { PortalSession } from '@/session/session';

export function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

export function renderApp(
  path = '/',
  session?: PortalSession,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App session={session} />
    </MemoryRouter>,
    options,
  );
}

export function renderWithRouter(ui: ReactElement, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}
