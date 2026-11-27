'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AssignmentResponse, AssignmentResponseInput, AssignmentResponses } from '../types/assignments.types';

export type { AssignmentResponse, AssignmentResponseInput, AssignmentResponses };

const FALLBACK_ERROR = 'Unable to save your answer right now.';

const readError = async (response: Response, fallback: string): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return fallback;
};

const responseUrl = (assignmentId: string) => `/api/assignments/${encodeURIComponent(assignmentId)}/response`;

/** What `respond` and `withdraw` resolve to, so the caller can show the server's message */
export type ResponseResult = { ok: true } | { ok: false; error: string };

/**
 * The freelancer's answers to assignments, saved on the server so editors can read them too.
 * State only changes once the server confirms, so the UI never shows an answer that was not stored.
 */
export function useAssignmentResponses() {
  const [responses, setResponses] = useState<AssignmentResponses>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/assignments/responses');
        if (!response.ok) throw new Error(await readError(response, 'Unable to load your answers right now.'));
        const body = (await response.json()) as { responses?: AssignmentResponses };
        if (!cancelled) setResponses(body.responses ?? {});
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load your answers right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const respond = useCallback(async (assignmentId: string, input: AssignmentResponseInput): Promise<ResponseResult> => {
    try {
      const response = await fetch(responseUrl(assignmentId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) return { ok: false, error: await readError(response, FALLBACK_ERROR) };

      const { response: saved } = (await response.json()) as { response: AssignmentResponse };
      setResponses((current) => ({ ...current, [assignmentId]: saved }));
      return { ok: true };
    } catch {
      return { ok: false, error: FALLBACK_ERROR };
    }
  }, []);

  /** Takes back an answer, e.g. to reconsider a declined assignment */
  const withdraw = useCallback(async (assignmentId: string): Promise<ResponseResult> => {
    try {
      const response = await fetch(responseUrl(assignmentId), { method: 'DELETE' });
      // 404 means there was nothing stored, which is what the caller wanted anyway
      if (!response.ok && response.status !== 404) {
        return { ok: false, error: await readError(response, FALLBACK_ERROR) };
      }

      setResponses((current) => {
        const rest = { ...current };
        delete rest[assignmentId];
        return rest;
      });
      return { ok: true };
    } catch {
      return { ok: false, error: FALLBACK_ERROR };
    }
  }, []);

  return { responses, loading, error, respond, withdraw };
}
