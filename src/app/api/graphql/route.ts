import { createYoga } from "graphql-yoga";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { schema } from "@/graphql/schema";
import type { GraphQLContext } from "@/graphql/context";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  context: async (): Promise<GraphQLContext> => ({
    session: await getServerSession(authOptions),
  }),
});

function handler(request: NextRequest) {
  return yoga.handleRequest(request, {});
}

export { handler as GET, handler as POST, handler as OPTIONS };
