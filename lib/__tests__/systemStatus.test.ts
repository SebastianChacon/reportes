import { describe, expect, it } from "vitest";
import { systemStatus, type Env } from "../systemStatus";
import { MIN_SECRET_LENGTH } from "../session";

const SECRET = "x".repeat(MIN_SECRET_LENGTH);

function find(env: Env, id: string) {
  const found = systemStatus(env).capabilities.find((c) => c.id === id);
  if (!found) throw new Error(`no capability ${id}`);
  return found;
}

describe("systemStatus", () => {
  it("reports the field wizard as needing nothing", () => {
    const field = find({}, "field");
    expect(field.state).toBe("always");
    expect(field.missing).toEqual([]);
  });

  it("names every missing email variable, not just the first", () => {
    expect(find({}, "email").missing).toEqual([
      "RESEND_API_KEY",
      "REPORT_TO_EMAIL",
      "REPORT_FROM_EMAIL",
    ]);
  });

  it("turns email on only once all three are set", () => {
    const partial = { RESEND_API_KEY: "re_x", REPORT_TO_EMAIL: "pm@x.com" };
    expect(find(partial, "email").state).toBe("off");
    expect(find({ ...partial, REPORT_FROM_EMAIL: "bot@x.com" }, "email").state).toBe("ready");
  });

  // Whitespace is how a variable set to "" in a dashboard reaches the process.
  it("treats a blank variable as unset", () => {
    expect(find({ NEXT_PUBLIC_CONVEX_URL: "   " }, "archive").state).toBe("off");
    expect(find({ NEXT_PUBLIC_CONVEX_URL: "https://x.convex.cloud" }, "archive").state).toBe("ready");
  });

  // The whole point of the screen: a short secret looks configured and is not.
  it("refuses a secret too short for sessionSecret to accept", () => {
    const short = { AUTH_SECRET: "x".repeat(MIN_SECRET_LENGTH - 1), NEXT_PUBLIC_CONVEX_URL: "u" };
    expect(find(short, "console").missing).toEqual(["AUTH_SECRET"]);
  });

  it("holds the console shut until it has both a secret and a deployment", () => {
    expect(find({ AUTH_SECRET: SECRET }, "console").missing).toEqual(["NEXT_PUBLIC_CONVEX_URL"]);
    expect(find({ NEXT_PUBLIC_CONVEX_URL: "u" }, "console").missing).toEqual(["AUTH_SECRET"]);
    expect(find({ AUTH_SECRET: SECRET, NEXT_PUBLIC_CONVEX_URL: "u" }, "console").state).toBe("ready");
  });

  it("calls a bare server field-only, and stops once anything is wired up", () => {
    expect(systemStatus({}).fieldOnly).toBe(true);
    expect(systemStatus({ NEXT_PUBLIC_CONVEX_URL: "u" }).fieldOnly).toBe(false);
  });
});
