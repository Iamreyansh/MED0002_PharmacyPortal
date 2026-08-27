import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '@/app/lib/medmate-ui-shim';

describe('medmate-ui-shim', () => {
  it('renders an accessible loading status', () => {
    render(<Spinner className="busy" block />);
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('busy');
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute(
      'data-block',
      'true',
    );
    expect(screen.queryByText('Loading')).toBeNull();
    render(<Spinner />);
    expect(screen.getAllByRole('status')[1]).not.toHaveAttribute('data-block');
  });
});
