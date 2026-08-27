import { beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Garde-fou : ne jamais vider une base qui ne ressemble pas à la base de
// test, même si .env.test est mal chargé ou absent.
if (!process.env.DATABASE_URL?.includes("kine_maxillo_test")) {
  throw new Error(
    `DATABASE_URL ne pointe pas vers la base de test (kine_maxillo_test) : ${process.env.DATABASE_URL}. ` +
      "Vérifie .env.test — les tests font des deleteMany() et ne doivent jamais tourner sur la base de dev."
  );
}

export async function resetDb(): Promise<void> {
  await prisma.appointment.deleteMany();
  await prisma.availableSlot.deleteMany();
}

beforeEach(async () => {
  await resetDb();
});
