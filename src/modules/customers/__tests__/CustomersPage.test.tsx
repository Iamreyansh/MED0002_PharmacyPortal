import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostApi } from '@/modules/api';
import { CustomersPage } from '@/modules/customers';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CustomersPage', () => {
  it('lists and searches customers', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        customers: [
          {
            customer_id: 'c1',
            name: 'Priya',
            phone: '+919876543210',
            invoices: 2,
          },
        ],
      },
    });
    render(<CustomersPage />);
    expect(await screen.findByTestId('customers-table')).toBeTruthy();
    await user.type(screen.getByLabelText('Search'), 'pri');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('shows empty and error states', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { customers: [] },
    });
    render(<CustomersPage />);
    expect(await screen.findByTestId('customers-empty')).toBeTruthy();
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 403,
      data: undefined as never,
      code: 'FORBIDDEN',
      message: 'No',
    });
    render(<CustomersPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No');
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: undefined as never,
      code: 'INTERNAL_ERROR',
    });
    render(<CustomersPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'INTERNAL_ERROR',
    );
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: undefined as never,
    });
    render(<CustomersPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load customers.',
    );
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {},
    });
    render(<CustomersPage />);
    expect(await screen.findByTestId('customers-empty')).toBeTruthy();
  });

  it('renders sparse customer rows', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        customers: [{ phone: null, name: null }],
      },
    });
    render(<CustomersPage />);
    expect(await screen.findByTestId('customers-table')).toHaveTextContent('—');
  });
});
