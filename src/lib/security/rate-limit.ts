import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getSql } from "@/lib/db/client";

export async function consumeRateLimit(
  namespace: string,
  identifier: string,
  maxAttempts = 8,
) {
  const forwardedFor =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = createHash("sha256")
    .update(`${namespace}:${forwardedFor}:${identifier}`)
    .digest("hex");
  const rows = await getSql()`
    INSERT INTO request_rate_limits (key,attempts,window_started_at) VALUES (${key},1,NOW())
    ON CONFLICT (key) DO UPDATE SET
      attempts=CASE WHEN request_rate_limits.window_started_at < NOW()-INTERVAL '15 minutes' THEN 1 ELSE request_rate_limits.attempts+1 END,
      window_started_at=CASE WHEN request_rate_limits.window_started_at < NOW()-INTERVAL '15 minutes' THEN NOW() ELSE request_rate_limits.window_started_at END
    RETURNING attempts
  `;
  return Number(rows[0].attempts) <= maxAttempts;
}
