export class GraphQLRequestError extends Error {}

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new GraphQLRequestError(
      json.errors[0]?.message ?? "Une erreur est survenue."
    );
  }
  return json.data as T;
}
