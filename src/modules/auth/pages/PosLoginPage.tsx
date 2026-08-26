import { useEffect, useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Navigate, useNavigate } from 'react-router-dom';
import { hostApi } from '@/modules/api';
import { applyTokenPair } from '@/modules/api';
import { loginErrorCopy } from '@/modules/auth/lib/errors';
import { isUuid } from '@/modules/auth/lib/identifier';
import { useSession, useSessionStore } from '@/modules/session';

const POS_LAST_KEY = 'medmate.portal.pos-last';
const KEYPAD = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '',
  '0',
  '⌫',
] as const;

function readLastIds(): { pharmacyId: string; staffId: string } {
  try {
    const raw = sessionStorage.getItem(POS_LAST_KEY);
    if (!raw) {
      return { pharmacyId: '', staffId: '' };
    }
    const parsed = JSON.parse(raw) as {
      pharmacyId?: unknown;
      staffId?: unknown;
    };
    return {
      pharmacyId:
        typeof parsed.pharmacyId === 'string' ? parsed.pharmacyId : '',
      staffId: typeof parsed.staffId === 'string' ? parsed.staffId : '',
    };
  } catch {
    return { pharmacyId: '', staffId: '' };
  }
}

function writeLastIds(pharmacyId: string, staffId: string): void {
  try {
    sessionStorage.setItem(
      POS_LAST_KEY,
      JSON.stringify({ pharmacyId, staffId }),
    );
  } catch {
    // Ignore storage failures on counter devices.
  }
}

export function PosLoginPage() {
  const session = useSession();
  const { applyPosLogin } = useSessionStore();
  const navigate = useNavigate();
  const inFlight = useRef(false);
  const last = readLastIds();
  const [pharmacyId, setPharmacyId] = useState(last.pharmacyId);
  const [staffId, setStaffId] = useState(last.staffId);
  const [pin, setPin] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      if (event.key >= '0' && event.key <= '9') {
        setPin((current) => (current + event.key).slice(0, 4));
      }
      if (event.key === 'Backspace') {
        setPin((current) => current.slice(0, -1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (session.authenticated && session.tokenScope === 'pos') {
    return <Navigate to="/pos" replace />;
  }
  if (session.authenticated && session.tokenScope === 'full') {
    return <Navigate to="/pos" replace />;
  }

  function pushDigit(digit: string) {
    if (digit === '⌫') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (!digit) {
      return;
    }
    setPin((current) => (current.length < 4 ? current + digit : current));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) {
      return;
    }
    if (!isUuid(pharmacyId) || !isUuid(staffId)) {
      setFieldError('Pharmacy and staff IDs are required.');
      return;
    }
    if (pin.length !== 4) {
      setFieldError('Enter a 4-digit PIN.');
      return;
    }
    setFieldError(null);
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await hostApi.request<Record<string, unknown>>({
        path: '/api/v1/auth/pharmacy/pos-pin',
        method: 'POST',
        body: { pharmacy_id: pharmacyId, staff_id: staffId, pin },
      });
      if (result.ok && result.data && applyTokenPair(result.data)) {
        flushSync(() => {
          applyPosLogin(result.data);
        });
        writeLastIds(pharmacyId, staffId);
        navigate('/pos', { replace: true });
        return;
      }
      if (result.code === 'INVALID_PIN') {
        setPin('');
      }
      setFormError(loginErrorCopy(result.code, result.message, result.details));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="page auth-page" data-testid="pos-login-page">
      <h1>POS sign in</h1>
      <p>Counter PIN sign-in. PIN is exactly four digits.</p>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {formError ? (
          <p className="form-error" role="alert" data-testid="pos-login-error">
            {formError}
          </p>
        ) : null}
        {fieldError ? (
          <p className="form-error" role="alert">
            {fieldError}
          </p>
        ) : null}
        <label className="field">
          <span>Pharmacy ID</span>
          <input
            name="pharmacy_id"
            type="text"
            autoComplete="off"
            value={pharmacyId}
            onChange={(event) => setPharmacyId(event.target.value.trim())}
          />
        </label>
        <label className="field">
          <span>Staff ID</span>
          <input
            name="staff_id"
            type="text"
            autoComplete="off"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value.trim())}
          />
        </label>
        <fieldset className="pin-field">
          <legend>PIN</legend>
          <p
            className="pin-display"
            aria-live="polite"
            data-testid="pin-display"
          >
            {pin.replace(/./g, '•').padEnd(4, '○')}
          </p>
          <div className="pin-keypad" role="group" aria-label="PIN keypad">
            {KEYPAD.map((key, index) =>
              key ? (
                <button
                  key={`${key}-${index}`}
                  type="button"
                  onClick={() => pushDigit(key)}
                >
                  {key === '⌫' ? 'Backspace' : key}
                </button>
              ) : (
                <button
                  key={`pad-${index}`}
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="pin-keypad__spacer"
                  onClick={() => pushDigit(key)}
                />
              ),
            )}
          </div>
        </fieldset>
        <button type="submit" disabled={submitting || pin.length !== 4}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
