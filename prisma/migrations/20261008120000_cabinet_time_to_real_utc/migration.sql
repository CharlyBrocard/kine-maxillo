-- Les heures de créneaux/RDV étaient stockées selon la convention
-- "UTC = heure du cabinet" (09:00 au cabinet enregistré 09:00 UTC). Elles
-- deviennent de vrais instants UTC (09:00 à Paris en octobre = 07:00 UTC),
-- comme le reste de l'application (voir src/lib/date-utils.ts).
-- Valeur lue comme heure de Paris → convertie en UTC. Heure d'été gérée par
-- Postgres. Les colonnes déjà en vrai UTC (createdAt, expiresAt…) ne
-- changent pas.
UPDATE "AvailableSlot"
SET "start" = ("start" AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC';

UPDATE "Appointment"
SET "slotStart" = ("slotStart" AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC',
    "slotEnd"   = ("slotEnd"   AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC';
