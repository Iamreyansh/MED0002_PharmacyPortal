import type { ComponentType } from 'react';

export const Spinner: ComponentType<{
  className?: string;
  block?: boolean;
}> = ({ className, block }) => (
  <span
    role="status"
    className={className}
    data-block={block ? 'true' : undefined}
  >
    Loading
  </span>
);
