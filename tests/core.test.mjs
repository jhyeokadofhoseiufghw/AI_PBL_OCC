import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import { calculateReservationTotal } from "../src/features/events/pricing.ts";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.ts";
import { normalizePhone } from "../src/features/reservations/phone.ts";

test("reservation total uses the event unit price", () => {
  assert.equal(calculateReservationTotal(15000, 3), 45000);
  assert.throws(() => calculateReservationTotal(-1, 1), RangeError);
  assert.throws(() => calculateReservationTotal(1000, 0), RangeError);
});
test("lookup passwords are salted and verifiable", async () => {
  const first = await hashPassword("1234"),
    second = await hashPassword("1234");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("1234", first), true);
  assert.equal(await verifyPassword("9999", first), false);
});
test("QR payload is encoded as a PNG data URL", async () => {
  const token = "secure-test-token-1234567890";
  const data = await QRCode.toDataURL(token);
  assert.match(data, /^data:image\/png;base64,/);
});
test("reservation phone lookup ignores formatting", () => {
  assert.equal(normalizePhone("010-1234-5678"), "01012345678");
  assert.equal(normalizePhone("010 1234 5678"), "01012345678");
  assert.equal(normalizePhone("01012345678"), "01012345678");
});
