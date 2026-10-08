"use client";

import { getSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Prolonge la session à chaque ouverture du backoffice et à chaque
 * changement de page : /api/auth/session réémet le cookie avec une
 * nouvelle date d'expiration (voir SESSION_MAX_AGE_SECONDS dans
 * src/lib/auth.ts). La session n'expire donc qu'après une période
 * d'inactivité.
 */
export function SessionKeepAlive() {
  const pathname = usePathname();
  useEffect(() => {
    void getSession();
  }, [pathname]);
  return null;
}
