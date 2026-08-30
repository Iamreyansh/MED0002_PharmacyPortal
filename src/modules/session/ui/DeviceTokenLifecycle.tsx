import { useEffect, useRef } from 'react';
import { getTokens } from '@/modules/api/store/token-store';
import {
  readPushLogId,
  registerDeviceToken,
  reportPushOpened,
} from '@/modules/session/lib/device-token';
import { useSessionStore } from '@/modules/session/store/SessionProvider';

export function DeviceTokenLifecycle() {
  const { bootstrapStatus, session } = useSessionStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    if (bootstrapStatus !== 'ready' || !session.authenticated) {
      return;
    }
    if (session.tokenScope === 'pos' || getTokens().tokenScope === 'pos') {
      return;
    }
    started.current = true;
    void registerDeviceToken();
    void reportPushOpened(readPushLogId(window.location.search));
  }, [bootstrapStatus, session.authenticated, session.tokenScope]);

  return null;
}
