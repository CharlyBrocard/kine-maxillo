import { describe, it, expect, vi } from "vitest";
import { devOutbox, sendEmail } from "@/lib/email/send";

describe("sendEmail in tests", () => {
  it("never calls Brevo, even when a BREVO_API_KEY is set", async () => {
    const saved = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "xkeysib-fake";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendEmail({ to: "x@example.com", subject: "s", html: "h", text: "t" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(devOutbox).toHaveLength(1);
    fetchSpy.mockRestore();
    process.env.BREVO_API_KEY = saved;
  });
});
