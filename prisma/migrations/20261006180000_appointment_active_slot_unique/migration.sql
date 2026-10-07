-- Anti double-booking au niveau base : au plus un RDV actif (PENDING ou
-- CONFIRMED) par créneau et par catégorie. La vérification applicative
-- (isSlotAvailable) ne suffit pas seule : deux requêtes simultanées
-- peuvent la passer toutes les deux avant que l'une n'insère.
-- Index partiel non exprimable dans schema.prisma (voir le commentaire
-- sur le modèle Appointment).
CREATE UNIQUE INDEX "Appointment_active_slot_key"
  ON "Appointment" ("category", "slotStart")
  WHERE "status" IN ('PENDING', 'CONFIRMED');
