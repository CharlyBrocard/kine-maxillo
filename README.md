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

Ordre important : le site tourne d'abord en local sur le VPS (étapes 1 à
4), sans être public ; il ne devient public qu'au changement de DNS
(étape 5). Chaque étape se termine par une vérification — ne pas passer à
la suivante sans le résultat attendu.

**1. Clé de déploiement GitHub** (repo privé, accès en lecture seule)

a) Créer la clé et le raccourci SSH (`printf` plutôt qu'un bloc
`cat <<EOF`, qui se casse facilement au copier-coller) :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/kine_maxillo_deploy -N "" -C "vps kine-maxillo"
printf '\nHost github-kine-maxillo\n    HostName github.com\n    User git\n    IdentityFile ~/.ssh/kine_maxillo_deploy\n    IdentitiesOnly yes\n' >> ~/.ssh/config
chmod 600 ~/.ssh/config
ssh -G github-kine-maxillo | grep -E "^(hostname|identityfile) "
```
→ attendu : `hostname github.com` et `identityfile ~/.ssh/kine_maxillo_deploy`.

b) Ajouter la clé publique sur GitHub : afficher `cat
~/.ssh/kine_maxillo_deploy.pub`, puis repo → Settings → Deploy keys → Add
deploy key, **sans** cocher "Allow write access".

c) Tester puis cloner :

```bash
ssh -T git@github-kine-maxillo     # "yes" à la question d'empreinte la 1re fois
git clone -b main git@github-kine-maxillo:CharlyBrocard/kine-maxillo.git /var/www/kine-maxillo
```
→ attendu : `Hi CharlyBrocard/kine-maxillo! You've successfully
authenticated…` ("does not provide shell access" est normal).

**2. Fichier `.env` de production**

```bash
cd /var/www/kine-maxillo
cp deploy/env.production.example .env && chmod 600 .env
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"     # à copier dans .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"    # à copier dans .env
nano .env
```

- `ADMIN_EMAIL` : l'email de connexion au backoffice.
- `ADMIN_PASSWORD_HASH` : à générer **sur le poste de dev, depuis le
  dossier du projet** (là où `bcryptjs` est installé). Le mot de passe est
  demandé sans être affiché ni gardé dans l'historique — en choisir un
  long (12 caractères ou plus) :
  ```bash
  read -rs -p "Mot de passe admin : " PW; echo; PW="$PW" node -e "require('bcryptjs').hash(process.env.PW, 10).then(console.log)"; unset PW
  ```
  Coller le résultat **entre apostrophes** : `ADMIN_PASSWORD_HASH='$2b$10$…'`
  (sinon docker compose interprète les `$` et tronque le hash).
- `BREVO_API_KEY` : de préférence une clé dédiée à la prod (révocable
  séparément de celle du dev).

Vérifier, sans afficher les secrets :

```bash
grep -E "^[A-Z_]+=" .env | while IFS='=' read -r k v; do [ -z "$v" ] && echo "VIDE : $k" || echo "ok   : $k"; done
grep "^ADMIN_PASSWORD_HASH=" .env | sed -E 's/[./A-Za-z0-9]{53}/<53 car.>/'
```
→ attendu : que des `ok`, et `ADMIN_PASSWORD_HASH='$2b$10$<53 car.>'`.

**3. Démarrer l'application**

```bash
docker compose -f docker-compose.prod.yml up -d --build      # plusieurs minutes sur 1 CPU
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs migrate | tail -3
curl -sI http://127.0.0.1:3001 | head -1
```
→ attendu : `app` et `db` "Up" (db "healthy"), "All migrations have been
successfully applied", `HTTP/1.1 200 OK`.

**4. Nginx** (partagé avec les autres sites du VPS : `nginx -t` valide
toute la config **avant** le rechargement — en cas d'erreur, rien n'est
rechargé et les autres sites continuent de tourner)

```bash
cp deploy/nginx/kine-maxillo-lyon.com.conf /etc/nginx/sites-available/kine-maxillo-lyon.com
ln -s /etc/nginx/sites-available/kine-maxillo-lyon.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
curl -sI -H "Host: kine-maxillo-lyon.com" http://127.0.0.1 | head -1
curl -sI -H "Host: www.kine-maxillo-lyon.com" http://127.0.0.1 | grep -iE "^HTTP|^location"
```
→ attendu : `200 OK`, puis `301` vers `https://kine-maxillo-lyon.com/`.

**5. DNS chez OVH** (rend le site public) — Web Cloud → Noms de domaine →
`kine-maxillo-lyon.com` → Zone DNS. `<IP_DU_VPS>` : l'IPv4 publique du
serveur, affichée sur le VPS par `curl -4 ifconfig.me`.

- **modifier** (pas ajouter) les enregistrements A de la racine et de
  `www` → `<IP_DU_VPS>` ;
- **supprimer** le TXT `1|www.kine-maxillo-lyon.com` et la redirection
  web OVH (onglet "Redirection"), qui intercepterait le trafic ;
- **ne pas créer d'AAAA** (pas d'IPv6 sur le VPS) ;
- **ne pas toucher** aux enregistrements email : MX, SPF (`v=spf1…`),
  `brevo-code`, DKIM `brevo1`/`brevo2`, DMARC `_dmarc`.

```bash
dig +short kine-maxillo-lyon.com www.kine-maxillo-lyon.com   # attendre <IP_DU_VPS> pour les deux
```

**6. HTTPS** (Let's Encrypt doit pouvoir joindre le VPS par le domaine :
uniquement après l'étape 5)

```bash
certbot --nginx -d kine-maxillo-lyon.com -d www.kine-maxillo-lyon.com
curl -sI https://kine-maxillo-lyon.com | head -1        # HTTP/2 200
curl -sI http://kine-maxillo-lyon.com | grep -i location  # redirection vers https
certbot renew --dry-run                                   # le renouvellement automatique fonctionnera
```

La connexion au backoffice (`/espace`) ne fonctionne **qu'en HTTPS** :
avec `NEXTAUTH_URL` en `https://`, le cookie de session est marqué
"Secure" et le navigateur le refuse en HTTP. Tester la connexion
praticienne à ce moment-là.

**7. Sauvegardes quotidiennes** (3 h du matin, 14 jours gardés dans
`/var/backups/kine-maxillo` — voir "Sauvegardes et restauration")

```bash
crontab -l 2>/dev/null | grep -q kine-maxillo/deploy/backup.sh \
  || (crontab -l 2>/dev/null; echo "0 3 * * * /var/www/kine-maxillo/deploy/backup.sh >> /var/log/kine-maxillo-backup.log 2>&1") | crontab -
crontab -l | grep kine-maxillo          # une seule ligne
/var/www/kine-maxillo/deploy/backup.sh  # première sauvegarde tout de suite
ls -l /var/backups/kine-maxillo/
```
→ attendu : "Sauvegarde OK", un fichier `.sql.gz` en `-rw-------`. Le
lendemain, vérifier `/var/log/kine-maxillo-backup.log`.

**8. Brevo** : Sécurité → Adresses IP autorisées → ajouter
`<IP_DU_VPS>`, puis activer le blocage des IP non autorisées pour les
clés API. Tester ensuite une vraie prise de RDV : si l'email de validation
n'arrive pas, voir `docker compose -f docker-compose.prod.yml logs app`.

### Mise à jour du site (après une modif)

Sur le poste de dev : commit sur `develop`, push, fusion dans `main` (PR).
Puis sur le VPS, en root :

```bash
cd /var/www/kine-maxillo

# 1. Sauvegarde de la base avant de toucher à quoi que ce soit
./deploy/backup.sh

# 2. Récupérer le code et reconstruire / redémarrer
git pull
docker compose -f docker-compose.prod.yml up -d --build

# 3. Vérifier
docker compose -f docker-compose.prod.yml ps                 # app et db "Up", db "healthy"
docker compose -f docker-compose.prod.yml logs migrate | tail -3   # migrations OK
docker compose -f docker-compose.prod.yml logs app | tail -5       # "Ready"
curl -sI http://127.0.0.1:3001 | head -1                     # HTTP/1.1 200 OK

# 4. (De temps en temps) supprimer les anciennes images de build — sans risque pour la base
docker image prune -f
```

**La base de prod n'est jamais touchée par une mise à jour.** Les données
sont dans le volume Docker `kine-maxillo_db-data`, indépendant des
conteneurs : `up -d --build` reconstruit et remplace les conteneurs de
l'app, le volume reste. Les nouvelles migrations Prisma (s'il y en a)
sont appliquées automatiquement par le service `migrate` avant le
redémarrage de l'app — elles modifient la structure, pas les données
existantes (sauf migration écrite pour, à relire avant de déployer).

**Commandes qui SUPPRIMENT la base — ne jamais les lancer sur le VPS :**

| Commande | Pourquoi c'est dangereux |
|---|---|
| `docker compose -f docker-compose.prod.yml down -v` | le `-v` supprime les volumes, donc la base (`down` **sans** `-v` est sans danger) |
| `docker volume rm kine-maxillo_db-data` | supprime la base directement |
| `docker volume prune` / `docker system prune --volumes` | supprime les volumes non utilisés — y compris la base si les conteneurs sont arrêtés à ce moment-là, et ceux des **autres sites** du VPS |

**Si le `.env` change** (nouvelle clé, nouvelle variable) : `docker
compose -f docker-compose.prod.yml up -d --force-recreate app` pour que
l'app relise le fichier.

**Revenir à la version précédente** si la mise à jour pose problème :

```bash
git log --oneline -5                     # repérer le commit précédent
git checkout <commit>                    # code de la version précédente
docker compose -f docker-compose.prod.yml up -d --build
git checkout main                        # une fois corrigé côté dev, avant le prochain git pull
```

Attention : si la mise à jour contenait une migration, revenir au code
précédent ne défait pas la migration. Dans ce cas, restaurer la sauvegarde
faite à l'étape 1 (voir "Sauvegardes et restauration" ci-dessous) —
c'est pour ça qu'on la fait avant chaque mise à jour.

### Sauvegardes et restauration

`deploy/backup.sh` exporte toute la base (structure + données) avec
`pg_dump`, depuis l'intérieur du conteneur `db`, dans un fichier compressé
`/var/backups/kine-maxillo/kine_maxillo_<date>_<heure>.sql.gz` (lisible
par root uniquement), et supprime ceux de plus de 14 jours. Lancé chaque
nuit par cron, et à la main avant chaque mise à jour.

Ces sauvegardes sont sur le **même disque** que la base : elles protègent
d'une erreur (mauvaise manip, migration ratée), pas d'une perte du VPS.
Copie régulière hors du VPS à prévoir.

**Restaurer une sauvegarde** (remplace TOUTE la base actuelle par celle du
fichier — procédure testée) :

```bash
cd /var/www/kine-maxillo
ls -lt /var/backups/kine-maxillo/ | head        # choisir le fichier
F=/var/backups/kine-maxillo/kine_maxillo_AAAA-MM-JJ_HHMM.sql.gz
C="docker compose -f docker-compose.prod.yml"

./deploy/backup.sh                              # filet de sécurité : sauvegarde de l'état actuel
$C stop app                                     # plus d'écriture pendant la restauration
$C exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public"'
gunzip -c "$F" | $C exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
$C start app
```

`ON_ERROR_STOP=1` arrête la restauration à la première erreur au lieu de
continuer sur une base à moitié restaurée — dans ce cas, recommencer avec
la sauvegarde "filet de sécurité" faite juste avant.
