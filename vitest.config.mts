import { defineConfig } from "vitest/config";
import path from "path";
import { config as loadEnv } from "dotenv";

// Injecté via `test.env` (pas process.env ici) : c'est l'API Vitest prévue
// pour ça, et ça évite les soucis d'ordre entre setupFiles et le chargement
// d'environnement interne de Vite/Vitest.
const testEnv = loadEnv({ path: path.resolve(__dirname, ".env.test") }).parsed ?? {};

export default defineConfig({
  test: {
    environment: "node",
    env: testEnv,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts"],
    // Sans ça, graphql-js finit chargé deux fois (une copie via le
    // transform Vite, une autre via require() natif pour les deps
    // "externalisées"), et ses vérifications instanceof internes cassent
    // ("Cannot use GraphQLSchema ... from another module or realm").
    server: {
      deps: {
        inline: true,
      },
    },
    // Requêtes Postgres réelles à chaque test — les paralléliser sur
    // plusieurs process casserait l'isolation de resetDb() (voir tests/setup.ts).
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
