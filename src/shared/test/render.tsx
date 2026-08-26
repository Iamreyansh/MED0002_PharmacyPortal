import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { App } from '@/app/App';
import type { PharmacyOption, PortalSession } from '@/modules/session';

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
  options?: Omit<RenderOptions, 'wrapper'> & { pharmacies?: PharmacyOption[] },
) {
  const { pharmacies, ...renderOptions } = options ?? {};
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App session={session} pharmacies={pharmacies} />
    </MemoryRouter>,
    renderOptions,
  );
}

export function renderWithRouter(ui: ReactElement, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}
