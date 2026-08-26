import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { hostApi } from '@/api/client';
import { applyTokenPair, getTokens } from '@/api/token-store';
import { postAuthPath, readReturnParam } from '@/app/route-policy';
import { loginErrorCopy } from '@/auth/errors';
import { isValidIdentifier, normalizeIdentifier } from '@/auth/identifier';
import { sessionFromLogin } from '@/session/hydrate';
import { useSession, useSessionStore } from '@/session/SessionProvider';

export function LoginPage() {
  const session = useSession();
  const { applyLogin } = useSessionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const inFlight = useRef(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session.authenticated && session.tokenScope === 'pos') {
    return <Navigate to="/pos" replace />;
  }
  if (session.authenticated) {
    return <Navigate to={postAuthPath(session)} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) {
      return;
    }
    const nextId = normalizeIdentifier(identifier);
    const nextPassword = password;
    let valid = true;
    if (!nextId) {
      setIdentifierError('Enter your email or +91 mobile number.');
      valid = false;
    } else if (!isValidIdentifier(nextId)) {
      setIdentifierError('Use an email or +91 mobile number.');
      valid = false;
    } else {
      setIdentifierError(null);
    }
    if (!nextPassword) {
      setPasswordError('Enter your password.');
      valid = false;
    } else {
      setPasswordError(null);
    }
    if (!valid) {
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await hostApi.request<Record<string, unknown>>({
        path: '/api/v1/auth/pharmacy/login',
        method: 'POST',
        body: { identifier: nextId, password: nextPassword },
      });
      if (result.ok && result.data && applyTokenPair(result.data)) {
        flushSync(() => {
          applyLogin(result.data);
        });
        const hydrated = sessionFromLogin(result.data, getTokens().tokenScope);
        const returnTo = readReturnParam(location.search);
        navigate(postAuthPath(hydrated.session, returnTo), { replace: true });
        return;
      }
      if (result.status === 429) {
        setFormError(
          result.message ??
            (result.retryAfterSeconds
              ? `Too many attempts. Retry in ${result.retryAfterSeconds}s.`
              : 'Too many attempts. Try again shortly.'),
        );
        return;
      }
      setFormError(loginErrorCopy(result.code, result.message, result.details));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="page auth-page" data-testid="login-page">
      <h1>Sign in</h1>
      <p>Pharmacy staff sign in with email or +91 mobile number.</p>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {formError ? (
          <p className="form-error" role="alert" data-testid="login-error">
            {formError}
          </p>
        ) : null}
        <label className="field">
          <span>Email or mobile</span>
          <input
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(identifierError)}
            aria-describedby={identifierError ? 'identifier-error' : undefined}
          />
          {identifierError ? (
            <span id="identifier-error" className="field-error">
              {identifierError}
            </span>
          ) : null}
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          {passwordError ? (
            <span id="password-error" className="field-error">
              {passwordError}
            </span>
          ) : null}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
