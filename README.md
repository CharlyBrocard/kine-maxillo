# kine-maxillo-lyon

Site vitrine + prise de rendez-vous pour un cabinet de kinésithérapie
oro-maxillo-faciale à Lyon. Contexte complet et décisions produit dans
[`PROJECT.md`](./PROJECT.md).

## État actuel

Scaffold Next.js (App Router, TypeScript, Tailwind CSS v4) avec toutes les
pages de la maquette design (`Cabinet Kine Lyon.dc.html`) implémentées en
composants React. Le modèle de données Prisma (`AvailabilityRule`,
`AvailabilityException`, `Appointment` — voir PROJECT.md) est migré sur
Postgres et une API GraphQL (`/api/graphql`, graphql-yoga) l'expose
réellement : calcul de créneaux à la volée, prise de RDV avec blocage
anti-double-booking, confirmation/annulation par token, gestion des
disponibilités.

- `/` `/specialites` `/tarifs` `/contact` `/mentions-legales` — pages
  vitrine, données mockées (placeholders à remplacer, voir plus bas)
- `/rendez-vous` — **branché sur l'API GraphQL réelle** : créneaux
  chargés en direct (`availableSlots`), réservation (`requestAppointment`,
  hold `PENDING` anti-double-booking), puis "vérifiez votre email" avec un
  lien de démo (pas d'envoi Brevo pour l'instant — voir plus bas) vers
  `/rendez-vous/confirmation?token=...`, qui appelle réellement
  `confirmAppointment` ; le lien "Annuler ce rendez-vous" qui y apparaît
  appelle réellement `cancelAppointment` sur `/rendez-vous/annule`
- `/espace` — connexion praticienne (mockée, sans vraie auth) →
  `/espace/agenda` et `/espace/disponibilites` — **pas encore branché**,
  toujours sur données mockées
- `/api/graphql` — API GraphQL réelle (Postgres), non protégée pour
  l'instant : les mutations "admin" (`setAvailabilityRule`,
  `addAvailabilityException`, `cancelAppointmentAsAdmin`, la query
  `appointments`) n'ont pas encore d'auth devant elles — à ne pas exposer
  publiquement avant l'étape NextAuth

Pas d'envoi d'email réel (Brevo) : le parcours `/rendez-vous` affiche à
l'étape 3 un lien "Simuler le clic sur le lien de confirmation", clairement
identifié comme un raccourci de démo, en attendant le branchement Brevo.

Les informations du cabinet (nom, adresse, RPPS/ADELI, SIRET, tarif
pressothérapie) sont des placeholders repris de la maquette, centralisés
dans `src/lib/site-config.ts` — à remplacer avant mise en production.

## Développement

```bash
npm run db:up          # démarre Postgres (Docker)
npm run prisma:migrate # applique les migrations Prisma
npm run dev             # serveur de développement
npm run build           # build de production
npm run lint            # ESLint
npm run prisma:studio   # explorer la base de données
```

`.env` contient déjà des identifiants Postgres locaux (`kine` / `kine`,
localhost uniquement) pour que `db:up` + `prisma:migrate` fonctionnent
directement.
