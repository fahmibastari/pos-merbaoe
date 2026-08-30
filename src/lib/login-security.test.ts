import assert from "node:assert/strict";
import test from "node:test";
import {
  isLoginAttemptBlocked,
  loginRetryAfterSeconds,
  LOGIN_WINDOW_MS,
  nextLoginAttemptState,
  normalizeLoginUsername,
  type LoginAttemptState,
} from "./login-security";

test("username login dinormalisasi tanpa mengubah karakter yang sah", () => {
  assert.equal(normalizeLoginUsername("  Kasir.Pagi  "), "kasir.pagi");
});

test("jeda login bertingkat pada kegagalan ketiga, keempat, dan kelima", () => {
  const startedAt = new Date("2026-08-29T00:00:00.000Z");
  let state: LoginAttemptState | null = null;

  state = nextLoginAttemptState(state, startedAt);
  assert.deepEqual(
    { count: state.failedCount, blockedUntil: state.blockedUntil },
    { count: 1, blockedUntil: null },
  );
  state = nextLoginAttemptState(state, new Date(startedAt.getTime() + 500));
  assert.equal(state.failedCount, 2);
  assert.equal(state.blockedUntil, null);

  const thirdAt = new Date(startedAt.getTime() + 1_000);
  state = nextLoginAttemptState(state, thirdAt);
  assert.equal(state.failedCount, 3);
  assert.equal(loginRetryAfterSeconds(state, thirdAt), 2);
  assert.equal(isLoginAttemptBlocked(state, thirdAt), true);

  const fourthAt = new Date(startedAt.getTime() + 3_000);
  state = nextLoginAttemptState(state, fourthAt);
  assert.equal(state.failedCount, 4);
  assert.equal(loginRetryAfterSeconds(state, fourthAt), 5);

  const fifthAt = new Date(startedAt.getTime() + 8_000);
  state = nextLoginAttemptState(state, fifthAt);
  assert.equal(state.failedCount, 5);
  assert.equal(
    state.blockedUntil?.getTime(),
    startedAt.getTime() + LOGIN_WINDOW_MS,
  );
});

test("jendela kegagalan dimulai ulang setelah 15 menit", () => {
  const startedAt = new Date("2026-08-29T00:00:00.000Z");
  const previous: LoginAttemptState = {
    failedCount: 5,
    windowStartedAt: startedAt,
    blockedUntil: new Date(startedAt.getTime() + LOGIN_WINDOW_MS),
  };
  const now = new Date(startedAt.getTime() + LOGIN_WINDOW_MS);
  const next = nextLoginAttemptState(previous, now);
  assert.equal(next.failedCount, 1);
  assert.equal(next.windowStartedAt.getTime(), now.getTime());
  assert.equal(next.blockedUntil, null);
});
