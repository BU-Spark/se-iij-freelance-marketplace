'use client';

import { useCallback, useEffect, useState } from 'react';

/** How a freelancer answered an assignment */
export type AssignmentResponse =
  | { kind: 'interested'; at: string }
  | { kind: 'declined'; reasons: string[]; note: string; at: string }
  | { kind: 'negotiating'; proposal: string; at: string };

/** Everything answered, keyed by assignment id */
export type AssignmentResponses = Record<string, AssignmentResponse>;

export const RESPONSES_STORAGE_KEY = 'freelancer-assignment-responses';

const read = (): AssignmentResponses => {
  try {
    const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as AssignmentResponses) : {};
  } catch {
    return {};
  }
};

/**
 * The freelancer's answers to assignments.
 * There is no endpoint for these yet, so they live in this browser only: editors do not see them
 * until the answers are saved on the server.
 */
export function useAssignmentResponses() {
  // Start empty and load after mount, so the server render and the first client render match
  const [responses, setResponses] = useState<AssignmentResponses>({});

  useEffect(() => {
    setResponses(read());
  }, []);

  const save = useCallback((next: AssignmentResponses) => {
    setResponses(next);
    try {
      window.localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save the assignment response.', error);
    }
  }, []);

  const respond = useCallback(
    (assignmentId: string, response: AssignmentResponse) => save({ ...read(), [assignmentId]: response }),
    [save]
  );

  /** Takes back an answer, e.g. to reconsider a declined assignment */
  const withdraw = useCallback(
    (assignmentId: string) => {
      const rest = { ...read() };
      delete rest[assignmentId];
      save(rest);
    },
    [save]
  );

  return { responses, respond, withdraw };
}
