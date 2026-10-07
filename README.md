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
  "vérifiez votre email" : le lien reçu par email mène à
  `/rendez-vous/confirmation?token=...` (`confirmAppointment`), le lien
  d'annulation à `/rendez-vous/annule?token=...` (`cancelAppointment`)
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

Emails transactionnels via l'API Brevo (`src/lib/email/`, variables dans
`.env.example`). **En dev, sans `BREVO_API_KEY`, rien n'est envoyé** : les
emails (avec les liens de validation/annulation) s'affichent dans la
console de `npm run dev` — copier le lien de validation depuis là pour
tester le parcours.

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

## Déploiement (VPS)

Stack de prod : `docker-compose.prod.yml` — l'app Next.js (image
`Dockerfile`, sortie `standalone`) sur `127.0.0.1:3001`, un Postgres dédié
sans port publié, et un service `migrate` qui applique les migrations
Prisma avant chaque démarrage de l'app. Nginx, déjà installé sur l'hôte,
fait le reverse proxy (`deploy/nginx/`), certbot gère le HTTPS. Les tâches
de fond (expiration des RDV non confirmés, purge du motif) tournent toutes
les heures dans le serveur (`src/instrumentation.ts`).

### Première installation (en root sur le VPS)

1. **Clé de déploiement GitHub** (repo privé, lecture seule) :
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/kine_maxillo_deploy -N "" -C "vps kine-maxillo"
   cat ~/.ssh/kine_maxillo_deploy.pub   # à ajouter dans GitHub : repo → Settings → Deploy keys (sans "write access")
   cat >> ~/.ssh/config <<'CFG'
   Host github-kine-maxillo
     HostName github.com
     User git
     IdentityFile ~/.ssh/kine_maxillo_deploy
     IdentitiesOnly yes
   CFG
   git clone -b main git@github-kine-maxillo:CharlyBrocard/kine-maxillo.git /var/www/kine-maxillo
   ```
2. **Fichier `.env`** : `cp deploy/env.production.example .env`, puis
   remplir chaque valeur (`chmod 600 .env`). Pour `ADMIN_PASSWORD_HASH`,
   générer le hash sur le poste de dev (`node -e
   "require('bcryptjs').hash('<mot de passe>', 10).then(console.log)"`) et
   le coller **entre apostrophes** (`ADMIN_PASSWORD_HASH='$2b$10$...'`) :
   docker compose n'interprète pas les `$` entre apostrophes.
3. **Démarrer** :
   ```bash
   cd /var/www/kine-maxillo
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml logs migrate app   # migrations OK, "Ready"
   curl -sI http://127.0.0.1:3001 | head -1                     # HTTP/1.1 200 OK
   ```
4. **Nginx** :
   ```bash
   cp deploy/nginx/kine-maxillo-lyon.com.conf /etc/nginx/sites-available/kine-maxillo-lyon.com
   ln -s /etc/nginx/sites-available/kine-maxillo-lyon.com /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx     # nginx -t AVANT le reload : ne pas casser les autres sites
   ```
5. **DNS chez OVH** : enregistrements A de `kine-maxillo-lyon.com` et
   `www` → IP du VPS (à la place de la page de parking OVH). Pas d'AAAA
   (pas d'IPv6 sur le VPS). Attendre que `dig +short kine-maxillo-lyon.com`
   renvoie l'IP du VPS.
6. **HTTPS** :
   ```bash
   certbot --nginx -d kine-maxillo-lyon.com -d www.kine-maxillo-lyon.com
   ```
7. **Sauvegardes quotidiennes** (3 h du matin, 14 jours gardés dans
   `/var/backups/kine-maxillo`) :
   ```bash
   (crontab -l 2>/dev/null; echo "0 3 * * * /var/www/kine-maxillo/deploy/backup.sh >> /var/log/kine-maxillo-backup.log 2>&1") | crontab -
   ```
   Restauration : `gunzip -c <fichier>.sql.gz | docker compose -f
   docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d
   "$POSTGRES_DB"'` (sur une base vide).
8. **Brevo** : activer le blocage des IP non autorisées pour les clés API
   avec l'IPv4 du VPS (voir PROJECT.md, étape 14).

### Mise à jour

```bash
cd /var/www/kine-maxillo
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
