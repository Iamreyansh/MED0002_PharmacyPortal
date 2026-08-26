const POS_LAST_KEY = 'medmate.portal.pos-last';

export type PosLastIds = { pharmacyId: string; staffId: string };

export function readPosLastIds(): PosLastIds {
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

export function writePosLastIds(pharmacyId: string, staffId: string): void {
  try {
    sessionStorage.setItem(
      POS_LAST_KEY,
      JSON.stringify({ pharmacyId, staffId }),
    );
  } catch {
    // Ignore storage failures on counter devices.
  }
}
