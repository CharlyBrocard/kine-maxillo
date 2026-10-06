# kine-maxillo-lyon

Site vitrine + prise de rendez-vous pour un cabinet de kinésithérapie
oro-maxillo-faciale à Lyon. Contexte complet et décisions produit dans
[`PROJECT.md`](./PROJECT.md).

## État actuel

Scaffold Next.js (App Router, TypeScript, Tailwind CSS v4) avec toutes les
pages de la maquette design (`Cabinet Kine Lyon.dc.html`) implémentées en
composants React. Le modèle de données Prisma (`AvailableSlot`,
`Appointment` — voir PROJECT.md) est migré sur Postgres et une API GraphQL
(`/api/graphql`, graphql-yoga) l'expose réellement : calcul de créneaux à la
volée par catégorie, prise de RDV avec blocage anti-double-booking,
confirmation/annulation par token.

Deux catégories de RDV (`MAXILLO_FACIAL`, `PRESSOTHERAPIE`), chacune avec sa
propre disponibilité, durée fixe de 30 min. Pas de récurrence : les
créneaux sont ouverts un par un par la praticienne (voir PROJECT.md,
"Décisions produit").

- `/` `/specialites` `/tarifs` `/contact` `/mentions-legales` — pages
  vitrine, données mockées (placeholders à remplacer, voir plus bas)
- `/rendez-vous` — **branché sur l'API GraphQL réelle** : la catégorie se
  choisit en premier (les créneaux disponibles en dépendent), puis les
  créneaux chargés en direct (`availableSlots`), réservation
  (`requestAppointment`, hold `PENDING` anti-double-booking), puis
  "vérifiez votre email" avec un lien de démo (pas d'envoi Brevo pour
  l'instant — voir plus bas) vers `/rendez-vous/confirmation?token=...`,
  qui appelle réellement `confirmAppointment` ; le lien "Annuler ce
  rendez-vous" qui y apparaît appelle réellement `cancelAppointment` sur
  `/rendez-vous/annule`
- `/espace` — **connexion réelle** (NextAuth, mono-compte praticienne
  défini par `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`) → `/espace/agenda` et
  `/espace/disponibilites`, protégés (redirigent vers `/espace` sans
  session)
- `/espace/disponibilites` — **branché sur l'API réelle** : formulaire
  simple (date + heure + catégorie) pour ouvrir un créneau
  (`addAvailableSlot`), liste chronologique des créneaux ouverts
  (`availableSlotEntries`) avec suppression (`deleteAvailableSlot`) —
  bloquée côté serveur si le créneau est déjà réservé (annuler le RDV
  depuis l'agenda à la place). Pas de récurrence, chaque action persiste
  immédiatement
- `/espace/agenda` — **branché sur l'API réelle** : semaine calendaire
  (lundi-dimanche) navigable, RDV `PENDING`/`CONFIRMED` affichés par
  jour (`appointments`), annulation admin réelle
  (`cancelAppointmentAsAdmin`, sans token — la praticienne est déjà
  authentifiée). Les RDV `CANCELLED`/`EXPIRED` ne sont pas affichés. Pas
  de création manuelle de RDV depuis le backoffice pour l'instant (le
  bouton "+ Ajouter un RDV" de la maquette a été retiré plutôt que laissé
  décoratif — rien derrière pour l'instant)
- `/api/graphql` — API GraphQL réelle (Postgres). Toutes les opérations
  admin (`addAvailableSlot`, `deleteAvailableSlot`,
  `cancelAppointmentAsAdmin`, les queries `appointments`,
  `availableSlotEntries`) exigent une session NextAuth valide
  (`GraphQLError` `UNAUTHENTICATED` sinon)

Sécurité (détail dans PROJECT.md, étape 15) : index unique partiel
anti-double-booking, validation des entrées (`src/lib/validation.ts`),
limitation de débit en mémoire (`src/lib/rate-limit.ts`) sur la prise de
RDV et la connexion, purge du motif (`src/lib/retention.ts`), en-têtes de
sécurité (`next.config.ts`), introspection GraphQL coupée en production.

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
localhost uniquement) et un compte praticienne de dev
(`johanna@kine-maxillo-lyon.com` / `changeme-dev`) pour que tout fonctionne
directement. Voir `.env.example` pour regénérer `NEXTAUTH_SECRET` et
`ADMIN_PASSWORD_HASH` (et le piège des `$` du hash bcrypt à échapper en
`\$`, sinon Next.js et docker compose les tronquent silencieusement).

## Tests

```bash
npm test         # suite complète (crée/migre la base de test, puis Vitest)
npm run test:watch
```

Tests d'intégration contre une vraie base Postgres — `kine_maxillo_test`,
une base séparée sur le même Postgres local que le dev (`.env.test`), pour
que `npm test` ne touche jamais aux données manipulées à la main pendant que
tu testes l'app dans le navigateur. `tests/setup.ts` vide les tables avant
chaque test et refuse de démarrer si `DATABASE_URL` ne pointe pas vers cette
base de test (garde-fou contre une mauvaise config qui viderait la base de
dev par erreur).

Couverture actuelle : le calcul de créneaux (`src/lib/slots.test.ts`),
l'API GraphQL de bout en bout — réservation, anti-double-booking,
confirmation/annulation idempotentes, protection des opérations admin
(`src/graphql/resolvers.test.ts`) — et l'authentification
(`src/lib/auth.test.ts`). Pas encore de tests sur les composants React
(wizard de réservation, backoffice) ni de CI qui les rejoue automatiquement.
