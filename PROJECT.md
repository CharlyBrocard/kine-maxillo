# Site vitrine + prise de RDV — Kiné maxillo-facial (Lyon)

## Contexte
Site pour une kinésithérapeute spécialisée en rééducation oro-maxillo-faciale
(Lyon). Objectif : vitrine + prise de RDV ponctuelle, sans compte utilisateur
patient, backoffice simple pour la kiné.

- Domaine : `kine-maxillo-lyon.com` (acheté chez OVH ; authentifié dans
  Brevo — DKIM `brevo1`/`brevo2`, DMARC `p=none` à durcir plus tard)
- Pas de deadline stricte — dev visé dans les prochains jours
- DA/maquettes : à faire via Claude (design), pas encore produites
- Hébergement : VPS existant du dev (pas Vercel), via Docker

## Priorités absolues

Deux critères passent avant tout le reste, y compris avant de finir les
fonctionnalités restantes du plan plus bas :

1. **Sécurité de l'app.** Le site gère des coordonnées patients et un
   champ "motif" potentiellement assimilable à une donnée de santé — voir
   "Décisions produit" plus bas. Toute nouvelle fonctionnalité doit être
   évaluée sous cet angle avant d'être considérée terminée (auth sur les
   routes admin, validation des entrées, pas de fuite de données entre
   patients, secrets non exposés, etc.).
2. **SEO pour "kiné maxillo-facial ouest lyonnais".** L'objectif business
   du site est d'être trouvé par des patients qui cherchent une prise en
   charge oro-maxillo-faciale dans l'ouest lyonnais (Tassin, Charbonnières,
   Craponne, Écully, etc.) — pas seulement "Lyon" en général. À noter :
   l'adresse actuelle du site (`src/lib/site-config.ts`) est un
   placeholder "Lyon 6e", qui n'est pas dans l'ouest lyonnais — un point à
   trancher avec la vraie adresse du cabinet avant d'optimiser le SEO
   local (Google Business, structured data, mots-clés de zone).

## Contenu métier (à partir de sa fiche Google Business)

Trois axes de service :
1. **Rééducation oro-maxillo-faciale** : troubles de la mâchoire, douleurs de
   l'ATM (articulation temporo-mandibulaire), dysfonctionnements de la sphère
   oro-faciale
2. **Rééducation fonctionnelle classique** : post-opératoire, traumatologique,
   douleurs musculosquelettiques
3. **Drainage lymphatique par pressothérapie** (bottes) — seul acte pour
   lequel un tarif public sera affiché

> Note : ces trois axes restent la description du contenu vitrine
> (accueil, /specialites). Côté prise de RDV, les catégories 1 et 2
> ci-dessus sont fusionnées en une seule catégorie de réservation
> "Rééducation maxillo-faciale" (voir "Décisions produit") — la
> distinction reste visible dans le contenu marketing, mais pas dans le
> formulaire de réservation.

## Infos encore à récupérer (remplies manuellement par l'utilisateur)
- ~~Nom de la kiné~~ — Johanna Rouzier
- ~~Adresse du cabinet~~ — 6 Av. Jacques Nemos, 69390 Millery (ouest
  lyonnais — voir "Priorités absolues" : cohérent avec l'axe SEO)
- ~~Téléphone~~ — 04 72 30 74 85
- ~~Email de contact~~ — `contact@kine-maxillo-lyon.com` (redirection OVH
  vers la Gmail dédiée du cabinet, comme `rendezvous@`)
- ~~Numéro RPPS/ADELI + SIRET + assurance RCP~~ — renseignés
  (`src/lib/site-config.ts`)
- ~~Photos~~ — portrait de la praticienne (accueil, "À propos") +
  illustrations flat (visuel principal, `/specialites`)
- ~~Tarif de la pressothérapie~~ — 30 €
- ~~Hébergeur~~ — Hostinger International Ltd. (Chypre), serveur en
  France (Paris) : mentions légales + politique de confidentialité

**Validation de la praticienne faite (2026-10-09)** : contenus des pages,
motifs de consultation, durées de conservation, zone géographique,
documents à apporter, photo, politique de confidentialité.

~~Point à trancher~~ — validé tel quel : documents à apporter pour un RDV
de **pressothérapie**. L'email de confirmation (`whatToBring` dans
`src/lib/email/templates.ts`) ne demande actuellement qu'un moyen de
paiement (acte de confort, non remboursé), contre carte Vitale +
ordonnance + carte de mutuelle + paiement pour la rééducation. À changer
si certaines mutuelles la prennent en charge.

Point à trancher : le domaine réservé est `kine-maxillo-lyon.com`, mais le
cabinet est à Millery (ouest lyonnais), pas à Lyon — à voir si ça reste le
bon nom de domaine une fois le SEO local travaillé.

## Décisions produit

- **Pas de compte patient.** La prise de RDV se fait par formulaire +
  confirmation par **email** (lien de confirmation), pas de SMS (coût +
  complexité écartés).
- **Un seul compte réel** : la kiné, via NextAuth, pour le backoffice.
- **Durée fixe de 30 minutes**, quelle que soit la catégorie de RDV.
- **Deux catégories de RDV**, chacune avec sa propre disponibilité (un
  créneau ouvert pour l'une n'est pas proposé pour l'autre) :
  1. Rééducation maxillo-faciale
  2. Pressothérapie
- **Choix de la catégorie avant le choix du créneau** dans le parcours de
  réservation, puisque les créneaux disponibles varient selon la catégorie.
- **Annulation en self-service** : lien unique dans l'email de confirmation
  permettant au patient d'annuler lui-même (libère le créneau).
- **Notification à la kiné** par email à chaque nouveau RDV confirmé.
- **Gestion des disponibilités sans récurrence.** Pas de grille
  hebdomadaire : la praticienne ouvre les créneaux un par un (date + heure
  + catégorie) depuis le backoffice. Plus simple à gérer pour un volume de
  RDV faible, quitte à devoir en rajouter plus souvent.
- **Motif de consultation en liste de choix** (catégorie "Rééducation
  maxillo-faciale" uniquement) : le patient choisit un motif parmi une
  liste (`src/lib/motifs.ts`, avec "Autre"), plus une précision libre
  facultative — obligatoire pour "Autre". Plus lisible pour la
  praticienne dans l'agenda et cohérent avec la minimisation (une liste
  incite à en dire le minimum utile). Le motif est composé et validé côté
  serveur, enregistré dans `Appointment.reason` sous la forme
  "<motif> — <précision>" (pas de migration). La liste inclut la
  rééducation fonctionnelle, fusionnée dans cette catégorie. Pour la
  pressothérapie : précision libre facultative seule, comme avant.
  Libellés validés par la praticienne (2026-10-09).
- **Donnée de santé potentielle** : le champ "motif" du RDV est traité comme
  sensible → minimisation, purge après un délai, hébergement maîtrisé (VPS
  propre plutôt que SaaS US).

## Stack technique

- **Framework** : Next.js (App Router), TypeScript strict
- **API** : GraphQL (GraphQL Yoga ou Apollo Server) monté sur une route API
  Next.js
- **DB** : PostgreSQL (via Prisma), hébergée sur le VPS (Docker)
- **Auth** : NextAuth, un seul compte (la kiné)
- **Email transactionnel** : Brevo (société EU, offre gratuite ~300/jour) —
  pas de SMTP auto-hébergé (problèmes de délivrabilité/réputation IP sur VPS
  générique)
- **Déploiement** : Docker Compose (app + Postgres dédié) derrière le
  Nginx déjà installé sur le VPS (qui sert d'autres sites), HTTPS via
  certbot — voir README "Déploiement"

## Modèle de données

Implémenté (`prisma/schema.prisma`) — pas de génération de créneaux à
l'avance, la disponibilité vient directement des `AvailableSlot` ouverts un
par un par la praticienne, moins les RDV existants.

```
enum Category { MAXILLO_FACIAL, PRESSOTHERAPIE }

AvailableSlot
  id, start, category
  (durée déduite de SLOT_DURATION_MINUTES = 30, pas stockée)

Appointment
  id, slotStart, slotEnd, category
  patientName, patientPhone, patientEmail, reason
  status (pending | confirmed | cancelled | expired)
  confirmationToken, cancellationToken, expiresAt
  createdAt
```

Règle clé anti double-booking : une demande de RDV réserve immédiatement le
créneau en `pending` avec une expiration courte (~20-30 min). Sans
confirmation dans ce délai, le créneau se libère automatiquement.

Créneaux disponibles pour une catégorie = ses `AvailableSlot` moins les
`Appointment` de cette même catégorie en `pending` (non expirés) ou
`confirmed` sur la période.

(Historique : la V1 avait un modèle `AvailabilityRule` (grille hebdomadaire
récurrente) + `AvailabilityException`, remplacé par ce modèle plus simple
une fois la décision prise de ne pas gérer de récurrence.)

## Schéma GraphQL

```graphql
type Query {
  availableSlots(category: Category!, from: DateTime!, to: DateTime!): [Slot!]!

  # authentifié (kiné)
  appointments(from: DateTime!, to: DateTime!): [Appointment!]!
  availableSlotEntries(from: DateTime!, to: DateTime!): [AvailableSlot!]!
}

type Mutation {
  requestAppointment(input: RequestAppointmentInput!): RequestAppointmentPayload!
  confirmAppointment(token: String!): AppointmentPayload!
  cancelAppointment(token: String!): AppointmentPayload!

  # authentifié (kiné)
  addAvailableSlot(input: AddAvailableSlotInput!): AvailableSlot!
  deleteAvailableSlot(id: ID!): Boolean!
  cancelAppointmentAsAdmin(id: ID!): Appointment!
}
```

## Pages du site vitrine (esquisse)
- Accueil
- Présentation / spécialités (les 3 axes ci-dessus)
- Tarifs (pressothérapie uniquement)
- Contact
- Mentions légales (RPPS/ADELI, SIRET, adresse, etc.)
- Prise de RDV (intégrée, pas une page à part probablement)

## Prochaines étapes
1. ~~Maquettes UI (Claude design)~~ — fait, projet
   "Kinésithérapeute Lyon OMF" sur claude.ai/design
2. ~~Scaffold du repo + intégration DA~~ — fait : Next.js (App Router,
   TypeScript, Tailwind v4) avec toutes les pages de la maquette
   (vitrine, parcours RDV, backoffice) en composants React, données
   mockées côté client (pas encore de DB/API/auth/email réels). Voir
   README.md pour le détail des routes.
3. ~~Fondations données~~ — fait : `docker-compose.yml` (Postgres local),
   schéma Prisma initial (`AvailabilityRule`, `AvailabilityException`,
   `Appointment`) et migration appliquée. Modèle remplacé depuis, voir
   étape 10.
4. ~~API GraphQL~~ — fait : route `/api/graphql` (graphql-yoga) exposant
   le schéma esquissé plus haut (`availableSlots`, `requestAppointment`,
   `confirmAppointment`, `cancelAppointment`, mutations admin), avec le
   calcul de créneaux réel (règles + exceptions − RDV pending/confirmed)
   et le blocage anti-double-booking. Testée de bout en bout. Mutations
   admin (`setAvailabilityRule`, `addAvailabilityException`,
   `cancelAppointmentAsAdmin`, query `appointments`) protégées par auth
   depuis l'étape 7 ci-dessous. Schéma de disponibilités remplacé depuis,
   voir étape 10.
5. ~~Branchement du parcours de prise de RDV sur l'API~~ — fait :
   `/rendez-vous` charge les créneaux réels (`availableSlots`, navigation
   semaine par semaine) et réserve via `requestAppointment` ;
   `/rendez-vous/confirmation` et `/rendez-vous/annule` appellent
   réellement `confirmAppointment` / `cancelAppointment` (par token, en
   lisant `?token=...`). Testé de bout en bout. Emails : voir étape 6.
6. ~~Envoi d'email réel via Brevo~~ — fait (code), **reste la config du
   compte** : appel direct de l'API Brevo (`src/lib/email/send.ts`, sans
   SDK), contenus dans `src/lib/email/templates.ts`. Sans `BREVO_API_KEY`
   hors production, les emails sont affichés dans la console du serveur.
   - Patient : lien de validation à la demande (si l'envoi échoue, le
     créneau est libéré et une erreur est affichée), récapitulatif + lien
     d'annulation une fois confirmé, avis d'annulation si la praticienne
     annule un RDV confirmé. Bouton "Renvoyer l'email" réel
     (`resendConfirmationEmail`, 2 renvois max par RDV).
   - Praticienne (`PRACTITIONER_NOTIFICATION_EMAIL`) : chaque RDV confirmé
     et chaque annulation par un patient.
   - Le motif n'est dans **aucun** email (donnée de santé, boîte mail
     tierce) : la praticienne le lit dans le backoffice.
   - Les tokens ne sont plus renvoyés par `requestAppointment` (ils ne
     partent que par email) et le lien de démo est retiré.
   - Config prévue : compte Brevo créé avec une Gmail dédiée ; expéditeur
     sur le domaine (`EMAIL_FROM`, domaine authentifié dans Brevo via
     DKIM/SPF/DMARC chez OVH — jamais une adresse @gmail.com) ; réponses
     des patients (`EMAIL_REPLY_TO`) et notifications vers la Gmail.
7. ~~Auth NextAuth (mono-compte praticienne)~~ — fait : Credentials
   provider (`src/lib/auth.ts`), identifiants dans `ADMIN_EMAIL` /
   `ADMIN_PASSWORD_HASH` (pas de table `User` — un seul compte, comme
   décidé). `/espace` appelle réellement `signIn`, `/espace/(dashboard)`
   (agenda, disponibilités) redirige vers `/espace` sans session valide,
   et les mutations admin de l'API GraphQL exigent
   maintenant cette session (`UNAUTHENTICATED` sinon). Testé de bout en
   bout (accès refusé sans session, accepté avec, mauvais mot de passe
   rejeté).
8. ~~Branchement de /espace/disponibilites sur l'API~~ — fait (première
   version, sur le modèle `AvailabilityRule`/`AvailabilityException` —
   entièrement revu depuis, voir étape 10) : lecture et écriture via
   l'API GraphQL, plus de données mockées ni de bouton "Enregistrer" à
   part. Testé de bout en bout.
9. ~~Branchement de /espace/agenda sur l'API~~ — fait : semaine
   calendaire (lundi-dimanche) navigable, RDV `PENDING`/`CONFIRMED`
   affichés par jour via `appointments`, annulation admin réelle via
   `cancelAppointmentAsAdmin` (sans token, la praticienne est déjà
   authentifiée — différent de `cancelAppointment` côté patient). Les RDV
   `CANCELLED`/`EXPIRED` sont exclus de l'affichage. Testé de bout en
   bout. Le bouton "+ Ajouter un RDV" de la maquette a été retiré (il ne
   faisait rien) plutôt que laissé décoratif — pas de création manuelle
   de RDV depuis le backoffice pour l'instant, à ajouter plus tard si
   besoin (nécessiterait une nouvelle mutation admin : contrairement à
   `requestAppointment`, un RDV créé par la praticienne devrait être
   `CONFIRMED` directement, sans tokens ni hold `PENDING`).
   `mock-agenda.ts` supprimé (plus utilisé).
10. ~~Revue métier : catégories, durée fixe, disponibilités sans
    récurrence~~ — fait. Changements de fond (voir "Décisions produit") :
    - Durée uniforme de 30 min pour tout RDV (`SLOT_DURATION_MINUTES`),
      remplace l'ancien `40 min`.
    - Deux catégories de RDV (`Category` : `MAXILLO_FACIAL`,
      `PRESSOTHERAPIE`), chacune avec sa propre disponibilité.
    - `AvailabilityRule` (grille récurrente) et `AvailabilityException`
      supprimés du schéma Prisma, remplacés par `AvailableSlot` (créneau
      ponctuel : date + heure + catégorie, ajouté un par un par la
      praticienne, sans notion de récurrence ni d'exception).
    - `/rendez-vous` : la catégorie se choisit avant de voir les
      créneaux disponibles (nouvel écran, avant l'ancienne étape 1).
    - `/espace/disponibilites` entièrement réécrit : formulaire simple
      (date + heure + catégorie) + liste chronologique des créneaux
      ouverts avec suppression (bloquée côté serveur si le créneau est
      déjà réservé — invite à annuler le RDV depuis l'agenda à la place).
    - `motifs.ts` (3 motifs, dont un sans lien avec une catégorie de
      créneau) remplacé par `categories.ts` (2 catégories, alignées sur
      le modèle de disponibilité).
    - Testé de bout en bout, migration Prisma appliquée
      (`simplify_availability_no_recurrence`).
11. ~~Suppression de /espace/patients et /espace/reglages~~ — fait :
    c'étaient des stubs "bientôt disponible" de la maquette, jamais
    branchés. Décision prise après avoir évalué le coût de chacun :
    - **Patients** aurait été raisonnable à construire (annuaire dérivé
      des `Appointment` groupés par contact, sans nouveau modèle), mais
      irait à l'encontre du principe de minimisation du motif de RDV
      acté dans "Décisions produit" — à reconsidérer plus tard si
      besoin, en connaissance de ce compromis.
    - **Réglages** aurait nécessité un vrai chantier (les infos du
      cabinet sont dans `site-config.ts`, un fichier statique, pas en
      base — il aurait fallu un modèle Prisma dédié et faire lire les
      pages vitrine depuis la base). Pas de valeur immédiate tant que
      Claude modifie directement le code pour ces changements.
    Retirés de `Sidebar.tsx` plutôt que laissés comme liens morts.
12. Récupération des infos manquantes par l'utilisateur (nom, adresse,
   tarif, RPPS/ADELI, SIRET) — actuellement des placeholders de la
   maquette dans `src/lib/site-config.ts`
13. ~~Tests automatisés pour l'API~~ — fait : Vitest, tests d'intégration
    contre une vraie base Postgres de test (`kine_maxillo_test`, séparée
    de la base de dev — voir README.md "Tests"). Couvre le calcul de
    créneaux, le parcours GraphQL complet (réservation,
    anti-double-booking, idempotence confirm/cancel, protection des
    opérations admin) et l'auth. Pas de CI qui les rejoue automatiquement
    pour l'instant — juste `npm test` en local.
14. Déploiement sur le VPS — **fichiers prêts et testés en local**
    (`Dockerfile`, `docker-compose.prod.yml`, `deploy/`), procédure dans
    README "Déploiement". Reste à l'exécuter sur le VPS.
    - VPS (relevé le 2026-10-07) : Ubuntu 24.04, 1 CPU, 3,8 Go RAM,
      IPv4 72.60.191.204, pas d'IPv6. Nginx sur l'hôte sert déjà
      plusieurs sites (certbot pour le HTTPS) ; ports 3000 et 5432 déjà
      pris → app sur `127.0.0.1:3001`, Postgres dédié sans port publié.
      Projets dans `/var/www/` → `/var/www/kine-maxillo`.
    - Déploiement par `git pull` + `docker compose up -d --build` (comme
      les autres projets du VPS) ; repo privé → clé de déploiement GitHub
      en lecture seule.
    - ~~Tâche planifiée de purge du motif~~ — fait :
      `src/instrumentation.ts` lance expiration + purge toutes les heures
      dans le serveur de prod ;
    - Sauvegardes : `deploy/backup.sh` (pg_dump quotidien via cron,
      14 jours) — copie hors du VPS à prévoir ;
    - **Brevo : activer le blocage des IP non autorisées pour les clés
      API** (Sécurité → Adresses IP autorisées) une fois le VPS en place,
      pour qu'une clé qui fuiterait soit inutilisable ailleurs. Ajouter
      l'IPv4 **et** l'IPv6 du VPS (`curl -4 ifconfig.me` / `curl -6
      ifconfig.me` sur le VPS) — sinon un appel sortant en IPv6 est
      refusé. Pas avant le déploiement : l'IP de la box en dev change.
      Symptôme si mal configuré : "Impossible d'envoyer l'email de
      validation" côté patient, erreur Brevo dans les logs.
15. ~~Correctifs de sécurité~~ — fait :
    - **Double réservation** : index unique partiel en base
      (`Appointment_active_slot_key` : un seul RDV `PENDING`/`CONFIRMED`
      par créneau et catégorie, migration SQL manuelle car non
      exprimable dans `schema.prisma` — Prisma l'ignore sans le
      supprimer, vérifié avec `prisma migrate diff`). La vérification
      applicative seule laissait passer deux requêtes simultanées.
    - **Validation des entrées** (`src/lib/validation.ts`) : nom,
      téléphone, email, longueur du motif, format des tokens, période
      max de 93 jours sur les requêtes de créneaux/agenda.
    - **Limitation de débit** en mémoire (`src/lib/rate-limit.ts`, OK
      pour un seul conteneur) : 5 demandes de RDV/h par IP, 3/h par
      email ; connexion praticienne bloquée 15 min après 10 échecs par
      IP (bcrypt toujours exécuté pour ne pas révéler l'email admin).
    - **Purge du motif** (`src/lib/retention.ts`) : effacé
      immédiatement à l'annulation/expiration, et 30 jours
      (`REASON_RETENTION_DAYS`) après la fin du RDV sinon.
    - **Session praticienne** : expire après 7 jours **sans
      utilisation** (`SESSION_MAX_AGE_SECONDS`), prolongée à chaque
      ouverture/navigation du backoffice (`SessionKeepAlive`). Avant :
      30 jours fixes après la connexion, jamais prolongés.
      Anti brute-force testé en conditions réelles (2026-10-08).
    - **API** : GraphiQL et introspection désactivés en production.
    - **En-têtes HTTP** (`next.config.ts`) : anti-clickjacking,
      `Referrer-Policy: no-referrer` (les liens de confirmation portent
      un token), HSTS, nosniff, `x-powered-by` retiré.
    Reste ouvert : CSP complète (nécessite des nonces Next.js). Le
    formulaire de contact factice (`ContactForm.tsx`) a été supprimé
    plutôt que branché : `/contact` affiche téléphone + email cliquable
    (`mailto:`), suffisant pour le volume du cabinet et sans nouvelle
    surface d'attaque (spam, données patient en clair par email).
16. ~~**Avant la mise en prod — relecture du contenu et vraies images**~~
    — fait (validation de la praticienne le 2026-10-09).
    (à faire par l'utilisateur, avec la praticienne si besoin) :
    - **Relire le texte de toutes les pages vitrine** (accueil,
      `/specialites`, `/tarifs`, `/contact`, `/mentions-legales`) : il
      vient de la maquette et n'a pas été validé. Attention aux
      affirmations factuelles à confirmer, par exemple "Conventionné
      secteur 1" (accueil), les horaires (`siteConfig.horaires`) et
      l'accès PMR (`siteConfig.accesPmr`).
    - **Remplacer les images placeholder** (`PhotoPlaceholder`) par de
      vraies photos :
      - accueil : "photo cabinet / praticienne" (bandeau du haut),
        "portrait praticienne" ;
      - `/specialites` : "séance ATM / thérapie manuelle", "salle de
        rééducation", "bottes de pressothérapie".
      Photos à fournir avec l'accord des personnes visibles (patients
      compris) ; prévoir des textes alternatifs (`alt`) descriptifs,
      utiles aussi pour le SEO.
    - ~~Carte placeholder sur `/contact`~~ — fait : carte
      OpenStreetMap intégrée (`CabinetMap.tsx`, sans cookie → pas de
      bandeau de consentement, contrairement à Google Maps) + liens
      "Itinéraire" Google Maps / Waze / Plans ouverts au clic.
      Coordonnées (`siteConfig.coordonnees`) issues de la Base Adresse
      Nationale — **vérifier que le marqueur tombe au bon endroit**
      (idéalement côté entrée/école). À mentionner dans la politique de
      confidentialité : la carte charge des tuiles depuis les serveurs
      d'OpenStreetMap (adresse IP du visiteur transmise).
19. ~~Politique de confidentialité~~ — fait (2026-10-08) : page
    `/confidentialite` (liée depuis le pied de page, la case de
    consentement du formulaire de RDV, les mentions légales et le
    sitemap), rédigée d'après le fonctionnement réel : données, bases
    légales (6.1.b, 9.2.h pour le motif, 6.1.f sécurité), durées,
    destinataires (hébergeur, Brevo sans le motif, OpenStreetMap),
    cookies (aucun côté visiteurs — vérifié), droits, CNIL.
    - **Nouvelle purge des RDV** (`purgeExpiredAppointments`) pour
      respecter les durées annoncées : demandes jamais confirmées
      supprimées 30 jours après la demande, tous les RDV 12 mois après
      leur date (`UNCONFIRMED_RETENTION_DAYS`,
      `APPOINTMENT_RETENTION_DAYS`). Avant : coordonnées conservées
      indéfiniment. Durées validées par la praticienne (2026-10-09).
    - Logs Docker de prod bornés (rotation 3 × 10 Mo).
    - ~~Hébergeur et localisation du serveur~~ (Hostinger, Paris) et
      ~~relecture par la praticienne~~ — faits. Logs Nginx du VPS :
      rotation quotidienne, 14 jours conservés (`/etc/logrotate.d/nginx`,
      vérifié le 2026-10-09) — annoncé tel quel dans la politique. Pas un
      avis juridique : une relecture par un juriste reste possible.

18. ~~Fuseau horaire~~ — fait (2026-10-08) : les dates sont désormais de
    vrais instants UTC, et tout ce qui dépend du calendrier (jour,
    semaine, heure affichée ou saisie) est calculé en Europe/Paris, heure
    d'été comprise (`src/lib/date-utils.ts`). Avant, l'app traitait "UTC =
    heure du cabinet" : affichage juste mais comparaisons avec l'heure
    actuelle décalées de 1-2 h (créneau réservable jusqu'à 2 h après son
    début). Migration `cabinet_time_to_real_utc` qui convertit les
    créneaux/RDV existants — appliquée automatiquement au déploiement
    (service `migrate`) : **faire la sauvegarde avant** (procédure de
    mise à jour du README). Tests rejoués sous plusieurs fuseaux machine.
    Emails de RDV : `.ics` en pièce jointe (iPhone Mail) + lien "Ajouter à
    Google Agenda" (Gmail web), pour le patient et la praticienne.

17. ~~SEO technique~~ — fait :
    - Titre, description et URL canonique propres à chaque page vitrine
      (titres < 60 caractères, descriptions < 160) ; modèle de titre
      `<page> | Kiné à Millery` (`src/app/layout.tsx`).
    - `sitemap.xml` et `robots.txt` générés (`src/app/sitemap.ts`,
      `src/app/robots.ts`). `/espace`, `/api` et les pages à token
      (`/rendez-vous/confirmation`, `/rendez-vous/annule`) exclus et en
      `noindex` — un robot qui exécute le JavaScript confirmerait ou
      annulerait un RDV en visitant ces pages.
    - Données structurées schema.org `Physiotherapy` (adresse, horaires,
      téléphone, communes desservies, prise de RDV en ligne) sur toutes
      les pages vitrine (`src/lib/structured-data.ts`).
    - Favicon : monogramme "JR" (`src/app/icon.svg`) à la place du logo
      Next.js par défaut.
    - URL canonique de prod : `siteConfig.url` =
      `https://kine-maxillo-lyon.com` (sans www) → au déploiement,
      `www.` redirigé vers ce domaine par Nginx (`deploy/nginx/`).

    À faire / à trancher par l'utilisateur :
    - **Géographie** : Millery est au **sud-ouest** de Lyon (vallée du
      Garon), pas dans l'"ouest lyonnais" au sens courant (Tassin,
      Écully, Craponne, Charbonnières). Les recherches locales ciblent
      donc plutôt Brignais, Vourles, Charly, Grigny, Chaponost,
      Saint-Genis-Laval, Oullins. Liste à valider dans
      `siteConfig.communesProches` ; `siteConfig.zone` ("Ouest
      lyonnais", affiché sur le site) à corriger le cas échéant.
      → Validé par la praticienne tel quel (2026-10-09).
    - **Fiche Google Business Profile** : le levier n°1 du SEO local
      (carte Google, "kiné près de moi"). Vérifier que nom, adresse et
      téléphone y sont **strictement identiques** au site, y ajouter
      l'URL du site et le lien de RDV. Ensuite, ajouter l'URL de la
      fiche dans les données structurées (`sameAs`).
    - **Google Search Console** : après la mise en ligne, valider le
      domaine (enregistrement TXT chez OVH) et soumettre
      `https://kine-maxillo-lyon.com/sitemap.xml`. Tester les données
      structurées avec le Rich Results Test de Google.
    - **Contenu** (avec l'étape 16) : le titre H1 de l'accueil ("Retrouver
      une mâchoire libre…") ne contient aucun mot-clé ; en garder l'esprit
      mais y intégrer "kinésithérapeute maxillo-faciale" et la ville
      aiderait. Idem pour le H1 de `/specialites` ("Ce que je prends en
      charge").
    - **Image de partage** (Open Graph) : à créer une fois les vraies
      photos disponibles (aperçu du lien sur WhatsApp, Facebook…).
