ALTER TABLE "users"
  ADD CONSTRAINT "users_session_version_check"
  CHECK ("session_version" >= 1);

ALTER TABLE "login_attempts"
  ADD CONSTRAINT "login_attempts_failed_count_check"
  CHECK ("failed_count" >= 0 AND "failed_count" <= 5);
