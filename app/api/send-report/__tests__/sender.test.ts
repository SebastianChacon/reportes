import { describe, expect, it } from "vitest";
import { isPlaceholderSender } from "../route";

/**
 * The whole "the form does not send" bug was a REPORT_FROM_EMAIL left on a
 * reserved documentation domain: Resend answers 403 for those, which the route
 * used to report as a generic 502 the foreman was told to retry forever.
 */
describe("isPlaceholderSender", () => {
  it.each([
    "reports@backtonature.example",
    "office@example.com",
    "a@foo.test",
    "a@foo.invalid",
    "a@localhost",
  ])("rejects the unverifiable placeholder %s", (address) => {
    expect(isPlaceholderSender(address)).toBe(true);
  });

  it.each(["reports@backtonature.net", "Back to Nature <reports@backtonature.net>", "a@resend.dev"])(
    "accepts the real sending address %s",
    (address) => {
      expect(isPlaceholderSender(address)).toBe(false);
    }
  );

  it("treats a malformed address as a placeholder rather than passing it to Resend", () => {
    expect(isPlaceholderSender("not-an-email")).toBe(true);
    expect(isPlaceholderSender("")).toBe(true);
  });
});
