import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { submitHelp } from '@/modules/support/lib/submit-help';

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T): HostApiResponse<T> {
  return { ok: true, status: 200, data };
}

function fail(code: string): HostApiResponse<never> {
  return {
    ok: false,
    status: 404,
    data: undefined as never,
    code,
    message: code,
  };
}

describe('submitHelp', () => {
  it('loads the catalogue and article without attaching auth', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(ok({ articles: [{ id: 'hours', title: 'Hours' }] }));
    expect(await submitHelp({ screen: 'help', action: 'load' })).toMatchObject({
      ok: true,
      articles: [{ id: 'hours', title: 'Hours' }],
    });
    expect(request).toHaveBeenCalledWith(
      { path: '/api/v1/support/help', method: 'GET' },
      { skipAuth: true },
    );
    request.mockResolvedValueOnce(
      ok({ id: 'hours', title: 'Hours', body: 'Set hours in profile.' }),
    );
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'load',
        values: { articleId: 'hours' },
      }),
    ).toMatchObject({
      ok: true,
      article: { id: 'hours', title: 'Hours' },
    });
    expect(request).toHaveBeenCalledWith(
      { path: '/api/v1/support/help/articles/hours', method: 'GET' },
      { skipAuth: true },
    );
  });

  it('posts deflection and maps not-found', async () => {
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue(ok({}));
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'deflection',
        values: { articleId: 'hours', helpful: false },
      }),
    ).toMatchObject({ ok: true });
    expect(request).toHaveBeenCalledWith(
      {
        path: '/api/v1/support/help/deflection',
        method: 'POST',
        body: { article_id: 'hours', helpful: false },
      },
      { skipAuth: true },
    );
    request.mockResolvedValueOnce(fail('HELP_ARTICLE_NOT_FOUND'));
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'load',
        values: { articleId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'HELP_ARTICLE_NOT_FOUND' });
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'load',
        values: { articleId: '  ' },
      }),
    ).toMatchObject({ ok: false, code: 'HELP_ARTICLE_NOT_FOUND' });
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'load',
      } as never),
    ).toMatchObject({ ok: false, code: 'HELP_ARTICLE_NOT_FOUND' });
    expect(
      await submitHelp({ screen: 'help', action: 'load' } as never),
    ).toMatchObject({ ok: true });
    request.mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(await submitHelp({ screen: 'help', action: 'load' })).toMatchObject({
      ok: false,
    });
    expect(
      await submitHelp({
        screen: 'ticket-new',
        action: 'create',
        values: { subject: 'x' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'quote',
        values: { articleId: 'hours' },
      } as never),
    ).toMatchObject({ ok: false });
    request.mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(
      await submitHelp({
        screen: 'help-article',
        action: 'deflection',
        values: { articleId: 'hours', helpful: true },
      }),
    ).toMatchObject({ ok: false });
  });
});
