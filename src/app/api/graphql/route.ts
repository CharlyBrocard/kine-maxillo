import { createYoga, type Plugin } from "graphql-yoga";
import { NoSchemaIntrospectionCustomRule } from "graphql";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { schema } from "@/graphql/schema";
import type { GraphQLContext } from "@/graphql/context";

const isProduction = process.env.NODE_ENV === "production";

/** Pas de cartographie de l'API (opérations admin comprises) en production. */
const disableIntrospection: Plugin = {
  onValidate({ addValidationRule }) {
    addValidationRule(NoSchemaIntrospectionCustomRule);
  },
};

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  graphiql: !isProduction,
  plugins: isProduction ? [disableIntrospection] : [],
  context: async ({ request }): Promise<GraphQLContext> => ({
    session: await getServerSession(authOptions),
    clientIp: clientIpFromHeaders((name) => request.headers.get(name)),
  }),
});

function handler(request: NextRequest) {
  return yoga.handleRequest(request, {});
}

export { handler as GET, handler as POST, handler as OPTIONS };
