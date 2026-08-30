import type {
  SupportCommand,
  SupportSubmitResult,
} from '@medmate/support-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/support/lib/errors';
import { articleFrom, articlesFrom } from '@/modules/support/lib/query';

const HELP_PATH = '/api/v1/support/help';

export async function submitHelp(
  command: SupportCommand,
): Promise<SupportSubmitResult> {
  if (command.screen === 'help' && command.action === 'load') {
    const result = await hostApi.request<unknown>(
      { path: HELP_PATH, method: 'GET' },
      { skipAuth: true },
    );
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, articles: articlesFrom(result.data) };
  }

  if (command.screen !== 'help-article') {
    return { ok: false, formError: 'This screen cannot load help.' };
  }

  const articleId = command.values?.articleId?.trim() ?? '';
  if (!articleId) {
    return {
      ok: false,
      code: 'HELP_ARTICLE_NOT_FOUND',
      formError: 'This article was not found.',
    };
  }

  if (command.action === 'load') {
    const result = await hostApi.request<unknown>(
      {
        path: `${HELP_PATH}/articles/${encodeURIComponent(articleId)}`,
        method: 'GET',
      },
      { skipAuth: true },
    );
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, article: articleFrom(result.data) };
  }

  if (command.action === 'deflection') {
    const result = await hostApi.request<unknown>(
      {
        path: `${HELP_PATH}/deflection`,
        method: 'POST',
        body: {
          article_id: articleId,
          helpful: command.values.helpful,
        },
      },
      { skipAuth: true },
    );
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true };
  }

  return { ok: false, formError: 'This screen cannot load help.' };
}
