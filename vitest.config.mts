import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    /**
     * Git worktrees live under `.claude/worktrees/`, inside the repo. Each one
     * is a full checkout, so the default glob collects every branch's copy of
     * every test — and the `@` alias below points them all at *this* checkout's
     * `lib/`, so an old branch's component gets today's library. `npm test`
     * then reports crashes that exist in no commit.
     */
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
});
