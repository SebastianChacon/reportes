/**
 * The demonstration console account, in one place.
 *
 * It used to be a literal inside `convex/seed.ts`. It has to move because the
 * sign-in form now offers it as a prefill, and two copies of a password are two
 * copies that drift: change the seed and the form keeps offering the old one,
 * which fails as "wrong password" on a screen whose fields arrived already
 * filled. That is the most confusing way this feature can break, and it breaks
 * in front of whoever is being shown the product.
 *
 * **This is not a secret and must never be treated as one.** It is checked into
 * a public repository, it is compiled into the browser bundle whenever
 * `NEXT_PUBLIC_DEMO_SIGN_IN` is set, and the account it opens holds nothing but
 * invented reports written by `seed:demo`. It is a door, not a credential.
 *
 * The address is on `.test` — a reserved TLD that can never resolve — so nobody
 * can be emailed at it by accident and it can never be mistaken for a real
 * person's account.
 */
export const DEMO_OFFICE_ACCOUNT = {
  email: "demo@backtonature.test",
  name: "Demo (office)",
  password: "demo-back-to-nature",
} as const;

/** What the sign-in form starts with when this deployment is a demonstration. */
export type SignInPrefill = { email: string; password: string };

/**
 * The prefill for the sign-in form, or `null` on any normal deployment.
 *
 * **Server-only, and that is the entire security property.** The first version
 * of this exported the pair as a constant and let the client form decide at
 * runtime whether to use it — which put the password in `.next/static` on every
 * build, flag or no flag, because a static import is bundled whether or not it
 * is reached. Measured, not assumed: `grep -rl demo-back-to-nature .next/static`
 * found it. So the decision moved here, the form receives a prop, and a build
 * with the variable unset ships no password at all.
 *
 * `DEMO_SIGN_IN` deliberately has no `NEXT_PUBLIC_` prefix. That prefix is what
 * inlines a value into the browser bundle, and nothing about this needs to be
 * readable there — the page that calls this is a server component.
 *
 * Unset means no prefill, so forgetting the variable in production is the safe
 * outcome. There is no way to misconfigure this that leaks a password rather
 * than withholding one.
 */
export function signInPrefill(env = process.env): SignInPrefill | null {
  if ((env.DEMO_SIGN_IN ?? "").trim() !== "1") return null;
  return { email: DEMO_OFFICE_ACCOUNT.email, password: DEMO_OFFICE_ACCOUNT.password };
}
