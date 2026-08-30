import type { ReactElement } from 'react';

function Glyph({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path fill="currentColor" d={d} />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <Glyph
      size={16}
      d="M17 8h-1V7a4 4 0 0 0-8 0v1H6v14h12V8zm-7-1a2 2 0 1 1 4 0v1h-4V7z"
    />
  );
}

export function MenuGlyph() {
  return <Glyph d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />;
}

export function SignOutGlyph() {
  return (
    <Glyph d="M10 17v2H4V5h6v2H6v10h4zm3.6-9.4 1.4-1.4L20 11l-5 4.8-1.4-1.4 2.6-2.4H9v-2h7.2l-2.6-2.4z" />
  );
}

const FALLBACK_PATH =
  'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z';

const NAV_GLYPH_PATHS: Record<string, string> = {
  pos: 'M4 5h16v12H4V5zm2 2v8h12V7H6zm-2 12h16v2H4v-2zm5-9h2v3H9V10zm4 0h2v3h-2V10z',
  catalogue: 'M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z',
  'catalogue-mapping':
    'M7 7h10v2H7V7zm0 4h10v2H7v-2zm-3 8 4-4-1.4-1.4L4 16.2l-1.6-1.6L1 16l3 3zM7 17h10v2H7v-2z',
  inventory: 'M3 7l9-4 9 4v3H3V7zm0 5h8v9H3v-9zm10 0h8v9h-8v-9z',
  'inventory-expiry':
    'M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm1 6v2h8V8H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z',
  purchases:
    'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6.2 6l.8 2h11.5l-1.4 6H8.1L6.2 6zM3 4h2.4l.6 1.5L5.2 6H3V4z',
  racks: 'M3 4h18v3H3V4zm0 5h18v3H3V9zm0 5h18v3H3v-3zm0 5h18v2H3v-2z',
  distributors:
    'M3 7h11v9H3V7zm11 3h4l3 3v3h-7V10zM5.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  reorder: 'M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z',
  prescriptions:
    'M8 3h8l1 4H7l1-4zm-2 6h12v12H6V9zm3 3v2h2v2h2v-2h2v-2h-2V10h-2v2H9z',
  'rx-quotes': 'M6 3h12v18H6V3zm3 4h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z',
  orders: 'M7 3h10l1 3H6l1-3zm-2 5h14v13H5V8zm3 3v2h8v-2H8zm0 4v2h6v-2H8z',
  'drug-register':
    'M5 3h10a2 2 0 0 1 2 2v14l-4-2-4 2V5a2 2 0 0 1 2-2H5zm12 2h2v16l-2-1V5z',
  invoices:
    'M7 2h10l1 3v17l-3-1.5L12 22l-3-1.5L6 22V5l1-3zm1 7h8v2H8V9zm0 4h8v2H8v-2z',
  sales: 'M4 18V8h2v8h4V6h2v10h4V4h2v14H4z',
  khata:
    'M5 3h11a2 2 0 0 1 2 2v14H5V3zm3 4v2h7V7H8zm0 4v2h7v-2H8zm0 4v2h5v-2H8z',
  offers:
    'M12 2l2.4 4.8 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 16.8l.9-5.4L4.2 7.6l5.4-.8L12 2z',
  settlements:
    'M4 10h16v10H4V10zm2 3v2h4v-2H6zm8 0v2h4v-2h-4zM11 3h2v3h-2V3zM7 5l1.5 2.5L6 9 4 6.5 7 5zm10 0l3 1.5L18 9l-2.5-1.5L17 5z',
  subscription: 'M3 7h18v11H3V7zm2 3v2h6v-2H5zm0 4v2h4v-2H5z',
  'saas-billing':
    'M7 2h10l1 3v17l-3-1.5L12 22l-3-1.5L6 22V5l1-3zm1 7h8v2H8V9zm0 4h8v2H8v-2z',
  analytics: 'M4 18h16v2H4v-2zM6 10h3v6H6v-6zm5-6h3v12h-3V4zm5 4h3v8h-3V8z',
  support:
    'M12 3a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-6H7a5 5 0 0 1 10 0h-2v6h1a3 3 0 0 0 3-3v-3a7 7 0 0 0-7-7zm-3 16h6v2H9v-2z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm1.1-6.5-.9.9A2.2 2.2 0 0 0 12 14h-1v-.5c0-.6.2-1.1.7-1.6l1.2-1.2c.3-.3.5-.7.5-1.1A1.5 1.5 0 0 0 12 8.1 1.5 1.5 0 0 0 10.5 9.6H9a3.5 3.5 0 1 1 5.1 1.9z',
  profile:
    'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z',
  storefront: 'M4 8l1.5-4h13L20 8H4zm0 2h16v10H4V10zm3 3v4h4v-4H7z',
  roles:
    'M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11zm8.5-1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM9 13c-3 0-7 1.5-7 4.5V20h10v-2.5C12 14.5 10.6 13.4 9 13zm8.5 0c-.5 0-1 0-1.5.1 1.6.9 2.5 2.2 2.5 4.4V20h5v-2.5c0-2.6-3.1-4.5-6-4.5z',
  notifications:
    'M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zM18 16v-5a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z',
  sessions: 'M4 5h16v10H4V5zm3 12h10v2H7v-2zM8 8h8v4H8V8z',
  kyc: 'M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z',
};

export function hasNavGlyph(id: string): boolean {
  return Object.hasOwn(NAV_GLYPH_PATHS, id);
}

export function navGlyph(id: string): ReactElement {
  return <Glyph d={NAV_GLYPH_PATHS[id] ?? FALLBACK_PATH} />;
}
