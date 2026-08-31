import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostApi } from '@/modules/api';
import { NotificationsPage } from '@/modules/notifications';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('NotificationsPage', () => {
  it('lists notices and marks one read', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          notifications: [
            {
              id: 'n1',
              title: 'New order',
              body: 'Order waiting',
              is_read: false,
            },
          ],
        },
      })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { read: true } });
    render(<NotificationsPage />);
    expect(await screen.findByTestId('notifications-list')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(screen.queryByRole('button', { name: 'Mark read' })).toBeNull();
  });

  it('shows empty and error states', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { notifications: [] },
    });
    render(<NotificationsPage />);
    expect(await screen.findByTestId('notifications-empty')).toBeTruthy();
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: undefined as never,
      code: 'INTERNAL_ERROR',
    });
    render(<NotificationsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'INTERNAL_ERROR',
    );
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: undefined as never,
    });
    render(<NotificationsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load notices.',
    );
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {},
    });
    render(<NotificationsPage />);
    expect(await screen.findByTestId('notifications-empty')).toBeTruthy();
  });

  it('renders untitled notices and leaves unread siblings', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          notifications: [
            { id: 'n1', is_read: false },
            { id: 'n2', title: 'Keep', body: 'Body', is_read: false },
          ],
        },
      })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { read: true } });
    render(<NotificationsPage />);
    expect(await screen.findByText('Notice')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: 'Mark read' })[0]!);
    expect(screen.getByRole('button', { name: 'Mark read' })).toBeTruthy();
  });
});
