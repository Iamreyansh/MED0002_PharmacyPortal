import { useId, useRef, useState } from 'react';
import { hostApi } from '@/modules/api';
import { applyTokenPair } from '@/modules/api';
import { useToast } from '@/modules/shell/ui/Toast';
import { useSession, useSessionStore } from '@/modules/session';

export function PharmacySwitcher() {
  const session = useSession();
  const { pharmacies, applySwitch } = useSessionStore();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const labelId = useId();
  const selectable = pharmacies.filter((row) => row.isActive);

  if (session.tokenScope === 'pos' || selectable.length < 2) {
    return null;
  }

  async function switchTo(pharmacyId: string) {
    if (inFlight.current || pharmacyId === session.pharmacyId) {
      setOpen(false);
      return;
    }
    inFlight.current = true;
    setPending(true);
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/pharmacy/switch-pharmacy',
      method: 'POST',
      body: { pharmacy_id: pharmacyId },
    });
    inFlight.current = false;
    setPending(false);
    setOpen(false);
    if (result.ok && result.data && applyTokenPair(result.data)) {
      applySwitch(result.data);
      return;
    }
    showToast(result.code ?? result.message ?? 'FORBIDDEN');
  }

  return (
    <div className="switcher">
      <button
        type="button"
        className="switcher__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        data-testid="pharmacy-switcher"
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
      >
        <span id={labelId}>Pharmacy</span>
        <span>{session.pharmacyName}</span>
      </button>
      {open ? (
        <ul className="switcher__list" role="listbox" aria-labelledby={labelId}>
          {selectable.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                role="option"
                aria-selected={row.id === session.pharmacyId}
                disabled={pending}
                onClick={() => void switchTo(row.id)}
              >
                {row.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
