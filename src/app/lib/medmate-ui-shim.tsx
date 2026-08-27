import type { ComponentType } from 'react';

export const Spinner: ComponentType<{
  className?: string;
  block?: boolean;
}> = ({ className, block }) => (
  <span
    role="status"
    aria-label="Loading"
    className={['mm-spinner', block ? 'mm-spinner--block' : '', className]
      .filter(Boolean)
      .join(' ')}
    data-block={block ? 'true' : undefined}
  >
    <svg
      className="mm-spinner__icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 12a9 9 0 1 1-6.219-8.56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </span>
);
