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
 * a public repository, it is compiled into the browser bundle, and the account
 * it opens holds nothing but invented reports written by `seed:demo`. It is a
 * door, not a credential.
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

/**
 * What the sign-in form starts with.
 *
 * Unconditional on purpose. This used to sit behind a `DEMO_SIGN_IN` variable
 * that every environment had to set for itself, which meant the feature was
 * absent by default and looked broken everywhere it had not been configured —
 * including on the developer's own machine. The whole point is that the fields
 * are already full; a version of that which needs setting up is not it.
 *
 * The cost of dropping the flag is that this pair now ships in every build,
 * which is only a cost if it is a secret. It is not: it is a literal in a public
 * repository opening an account that holds invented reports. See above.
 *
 * **Remove this when the demonstration is over.** The line to delete is the
 * initial state in `components/office/SignInForm.tsx`; the account itself goes
 * with `npx convex run seed:clear`.
 *
 * Annotated as plain `string`, not inferred. Without the annotation the literals
 * narrow to their own values and `setEmail` stops accepting anything else —
 * which would make the two fields un-typeable, the exact opposite of a prefill.
 */
export const SIGN_IN_PREFILL: { email: string; password: string } = {
  email: DEMO_OFFICE_ACCOUNT.email,
  password: DEMO_OFFICE_ACCOUNT.password,
};
