import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Un seul compte réel — la kiné — voir "Décisions produit" dans
 * PROJECT.md. Pas de table User/adapter Prisma pour un unique compte :
 * les identifiants viennent de l'environnement (ADMIN_EMAIL,
 * ADMIN_PASSWORD_HASH), comparés à la connexion.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !adminPasswordHash) {
          throw new Error(
            "ADMIN_EMAIL / ADMIN_PASSWORD_HASH ne sont pas configurés."
          );
        }
        if (!credentials?.email || !credentials.password) return null;
        if (credentials.email !== adminEmail) return null;

        const valid = await bcrypt.compare(credentials.password, adminPasswordHash);
        if (!valid) return null;

        return { id: "practitioner", email: adminEmail };
      },
    }),
  ],
};
