import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { clientIpFromHeaders, hit, isLimited } from "@/lib/rate-limit";
import { LOGIN_RATE_LIMITED_ERROR } from "@/lib/auth-errors";

/**
 * Anti brute-force : au-delà de LOGIN_MAX_FAILURES échecs par IP sur la
 * fenêtre, toute tentative est refusée (sans même vérifier le mot de
 * passe) jusqu'à la fin de la fenêtre.
 */
export const LOGIN_MAX_FAILURES = 10;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60_000;

/**
 * Un seul compte réel — la kiné — voir "Décisions produit" dans
 * PROJECT.md. Pas de table User/adapter Prisma pour un unique compte :
 * les identifiants viennent de l'environnement (ADMIN_EMAIL,
 * ADMIN_PASSWORD_HASH), comparés à la connexion.
 */
/**
 * Durée de session : expire après SESSION_MAX_AGE_SECONDS **sans
 * utilisation**. Le backoffice prolonge la session à chaque ouverture et
 * navigation (SessionKeepAlive) — sans ça, le JWT expirerait à date fixe
 * après la connexion, même en usage quotidien.
 */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: {
    signIn: "/espace",
  },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !adminPasswordHash) {
          throw new Error(
            "ADMIN_EMAIL / ADMIN_PASSWORD_HASH ne sont pas configurés."
          );
        }

        const headers = (req?.headers ?? {}) as Record<string, string | undefined>;
        const failureKey = `login:ip:${clientIpFromHeaders((name) => headers[name])}`;
        if (isLimited(failureKey, LOGIN_MAX_FAILURES)) {
          throw new Error(LOGIN_RATE_LIMITED_ERROR);
        }

        // bcrypt systématique (même si l'email ne correspond pas) pour ne
        // pas révéler l'email admin par une différence de temps de réponse.
        const valid =
          !!credentials?.password &&
          (await bcrypt.compare(credentials.password, adminPasswordHash)) &&
          credentials.email === adminEmail;
        if (!valid) {
          hit(failureKey, LOGIN_MAX_FAILURES, LOGIN_FAILURE_WINDOW_MS);
          return null;
        }

        return { id: "practitioner", email: adminEmail };
      },
    }),
  ],
};
