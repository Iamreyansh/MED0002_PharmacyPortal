import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useViewportMode, viewportFromWidth } from '@/layout/use-viewport';
import { setViewportWidth } from '@/test/render';

afterEach(() => {
  cleanup();
  setViewportWidth(1280);
});

function Probe() {
  const mode = useViewportMode();
  return <span data-testid="mode">{mode}</span>;
}

describe('viewport', () => {
  it('maps widths to modes', () => {
    expect(viewportFromWidth(375)).toBe('mobile');
    expect(viewportFromWidth(800)).toBe('tablet');
    expect(viewportFromWidth(1280)).toBe('desktop');
  });

  it('updates on resize', () => {
    setViewportWidth(1280);
    render(<Probe />);
    expect(screen.getByTestId('mode')).toHaveTextContent('desktop');
    act(() => {
      setViewportWidth(500);
    });
    expect(screen.getByTestId('mode')).toHaveTextContent('mobile');
  });
});
