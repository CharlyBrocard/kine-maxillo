import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { authOptions, LOGIN_MAX_FAILURES } from "@/lib/auth";
import { LOGIN_RATE_LIMITED_ERROR } from "@/lib/auth-errors";

const TEST_EMAIL = "johanna@kine-maxillo-lyon.com";
const TEST_PASSWORD = "s3cret-test-password";

type Authorize = (
  credentials: { email: string; password: string } | undefined,
  req?: { headers: Record<string, string> }
) => Promise<unknown>;

// La fonction authorize() qu'on fournit à CredentialsProvider est stockée
// dans `provider.options.authorize`, pas `provider.authorize` directement
// (celui-ci est une version normalisée par next-auth qui attend un
// contexte de requête complet) — vérifié en pratique.
function authorize(): Authorize {
  const provider = authOptions.providers[0] as unknown as { options: { authorize: Authorize } };
  return provider.options.authorize;
}

describe("Credentials provider authorize()", () => {
  beforeAll(async () => {
    process.env.ADMIN_EMAIL = TEST_EMAIL;
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(TEST_PASSWORD, 10);
  });

  it("accepts the correct email + password", async () => {
    const user = await authorize()({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(user).toEqual({ id: "practitioner", email: TEST_EMAIL });
  });

  it("rejects the wrong password", async () => {
    const user = await authorize()({ email: TEST_EMAIL, password: "wrong-password" });
    expect(user).toBeNull();
  });

  it("rejects an email that doesn't match ADMIN_EMAIL", async () => {
    const user = await authorize()({ email: "someone-else@example.com", password: TEST_PASSWORD });
    expect(user).toBeNull();
  });

  it("rejects missing credentials without throwing", async () => {
    expect(await authorize()(undefined)).toBeNull();
    expect(await authorize()({ email: "", password: "" })).toBeNull();
  });

  it("throws if ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not configured", async () => {
    const savedEmail = process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAIL;

    await expect(authorize()({ email: TEST_EMAIL, password: TEST_PASSWORD })).rejects.toThrow();

    process.env.ADMIN_EMAIL = savedEmail;
  });

  it("locks an IP out after too many failures, even with the right password", async () => {
    const req = { headers: { "x-forwarded-for": "198.51.100.9" } };
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      expect(await authorize()({ email: TEST_EMAIL, password: "wrong" }, req)).toBeNull();
    }

    await expect(authorize()({ email: TEST_EMAIL, password: TEST_PASSWORD }, req)).rejects.toThrow(
      LOGIN_RATE_LIMITED_ERROR
    );
    // Une autre IP n'est pas affectée.
    const other = { headers: { "x-forwarded-for": "198.51.100.10" } };
    expect(await authorize()({ email: TEST_EMAIL, password: TEST_PASSWORD }, other)).toEqual({
      id: "practitioner",
      email: TEST_EMAIL,
    });
  });
});
