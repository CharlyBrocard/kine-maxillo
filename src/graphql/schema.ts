import { createSchema } from "graphql-yoga";
import { typeDefs } from "@/graphql/typeDefs";
import { resolvers } from "@/graphql/resolvers";

export const schema = createSchema({
  typeDefs,
  resolvers,
});
