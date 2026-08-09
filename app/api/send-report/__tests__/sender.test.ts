import { describe, expect, it } from "vitest";
import { isPlaceholderSender, isSameOrigin, rateLimited } from "../route";

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

/**
 * This route sends mail from the company's verified domain with up to 28MB of
 * attachments. Anyone who found the URL could drive it — these two checks are
 * what stop that.
 */
describe("isSameOrigin", () => {
  it("accepts the app posting to itself", () => {
    expect(isSameOrigin("https://reportes.backtonature.net", "reportes.backtonature.net")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
  });

  it("rejects another site posting across origins", () => {
    expect(isSameOrigin("https://evil.example", "reportes.backtonature.net")).toBe(false);
  });

  it("rejects a caller that sends no Origin at all, like curl", () => {
    expect(isSameOrigin(null, "reportes.backtonature.net")).toBe(false);
  });

  it("rejects a malformed Origin instead of throwing", () => {
    expect(isSameOrigin("://nonsense", "reportes.backtonature.net")).toBe(false);
  });
});

describe("rateLimited", () => {
  it("lets a normal day's reports through and stops a flood", () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 12; i += 1) expect(rateLimited(ip)).toBe(false);
    expect(rateLimited(ip)).toBe(true);
  });

  it("counts each caller separately", () => {
    for (let i = 0; i < 12; i += 1) rateLimited("198.51.100.1");
    expect(rateLimited("198.51.100.1")).toBe(true);
    expect(rateLimited("198.51.100.2")).toBe(false);
  });

  it("forgives a caller once its hits fall outside the window", () => {
    const start = 1_000_000;
    const ip = "192.0.2.9";
    for (let i = 0; i < 12; i += 1) rateLimited(ip, start);
    expect(rateLimited(ip, start)).toBe(true);
    expect(rateLimited(ip, start + 61 * 60 * 1000)).toBe(false);
  });
});
