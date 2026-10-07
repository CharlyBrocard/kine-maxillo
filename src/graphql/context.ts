import type { Session } from "next-auth";

export type GraphQLContext = {
  session: Session | null;
  /** Absent hors requête HTTP (tests) — voir clientIpFromHeaders. */
  clientIp?: string;
};
