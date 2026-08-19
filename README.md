# kine-maxillo-lyon

Site vitrine + prise de rendez-vous pour un cabinet de kinésithérapie
oro-maxillo-faciale à Lyon. Contexte complet et décisions produit dans
[`PROJECT.md`](./PROJECT.md).

## État actuel

Scaffold Next.js (App Router, TypeScript, Tailwind CSS v4) avec toutes les
pages de la maquette design (`Cabinet Kine Lyon.dc.html`) implémentées en
composants React, données mockées côté client. Le modèle de données Prisma
(`AvailabilityRule`, `AvailabilityException`, `Appointment` — voir
PROJECT.md) est en place et migré sur Postgres, mais pas encore branché :
pas d'API GraphQL, pas d'auth, pas d'envoi d'email réels, et les pages
utilisent toujours les données mockées (voir "Prochaines étapes" dans
PROJECT.md).

- `/` `/specialites` `/tarifs` `/contact` `/mentions-legales` — pages vitrine
- `/rendez-vous` — parcours de prise de RDV en 3 étapes (créneau fictif,
  coordonnées, vérification email), puis `/rendez-vous/confirmation` et
  `/rendez-vous/annule`
- `/espace` — connexion praticienne (mockée, sans vraie auth) →
  `/espace/agenda` et `/espace/disponibilites`

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
