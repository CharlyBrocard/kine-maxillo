import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

const TEST_EMAIL = "johanna@kine-maxillo-lyon.com";
const TEST_PASSWORD = "s3cret-test-password";

type Authorize = (
  credentials: { email: string; password: string } | undefined
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
});
