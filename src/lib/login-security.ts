export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1_000;

const THIRD_FAILURE_DELAY_MS = 2_000;
const FOURTH_FAILURE_DELAY_MS = 5_000;

export type LoginAttemptState = {
  failedCount: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
};

export function normalizeLoginUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isLoginWindowExpired(
  attempt: Pick<LoginAttemptState, "windowStartedAt">,
  now: Date,
): boolean {
  return attempt.windowStartedAt.getTime() + LOGIN_WINDOW_MS <= now.getTime();
}

export function isLoginAttemptBlocked(
  attempt: Pick<LoginAttemptState, "blockedUntil"> | null,
  now: Date,
): boolean {
  return Boolean(
    attempt?.blockedUntil && attempt.blockedUntil.getTime() > now.getTime(),
  );
}

export function nextLoginAttemptState(
  current: LoginAttemptState | null,
  now: Date,
): LoginAttemptState {
  if (!current || isLoginWindowExpired(current, now)) {
    return {
      failedCount: 1,
      windowStartedAt: now,
      blockedUntil: null,
    };
  }

  const failedCount = Math.min(
    current.failedCount + 1,
    LOGIN_MAX_FAILURES,
  );
  const windowEndsAt = new Date(
    current.windowStartedAt.getTime() + LOGIN_WINDOW_MS,
  );
  let blockedUntil: Date | null = null;

  if (failedCount >= LOGIN_MAX_FAILURES) {
    blockedUntil = windowEndsAt;
  } else if (failedCount === 4) {
    blockedUntil = new Date(
      Math.min(now.getTime() + FOURTH_FAILURE_DELAY_MS, windowEndsAt.getTime()),
    );
  } else if (failedCount === 3) {
    blockedUntil = new Date(
      Math.min(now.getTime() + THIRD_FAILURE_DELAY_MS, windowEndsAt.getTime()),
    );
  }

  return {
    failedCount,
    windowStartedAt: current.windowStartedAt,
    blockedUntil,
  };
}

export function loginRetryAfterSeconds(
  attempt: Pick<LoginAttemptState, "blockedUntil">,
  now: Date,
): number {
  if (!attempt.blockedUntil) return 0;
  return Math.max(
    0,
    Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1_000),
  );
}
