# Gestion des tickets et du matériel

Application web JavaScript/JSX construite avec Next.js App Router, React, Prisma et PostgreSQL. Les pages et Route Handlers restent dans `app/`; les modules réutilisables sont organisés sous `src/frontend/`, `src/backend/` et `src/shared/`.

## Démarrer le projet

Configurer `DATABASE_URL` dans `.env`, puis lancer :

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

L’application est disponible sur <http://localhost:3000>.

Après une modification de `prisma/schema.prisma`, appliquer la migration puis régénérer le client Prisma. Si `prisma generate` échoue sur Windows avec `EPERM`, arrêter d’abord le serveur Next.js (`Ctrl+C`), puis relancer la génération.

La migration `20261019111000_remove_equipment_model` supprime l’ancienne table `Equipment` ainsi que la colonne `EquipmentRequest.equipmentId`. Les données éventuellement présentes dans la table `Equipment` seront supprimées lors de son application.

Commandes de vérification :

```bash
npm run lint
npx prisma validate
```

## Rôles

- `utilisateur` : envoie des demandes d’équipement, déclare une panne sur son matériel accepté et consulte ses propres déclarations.
- `admin` : traite les demandes, consulte toutes les déclarations et modifie leur statut.
- `responsable` : rôle reconnu par les sessions ; les pages spécifiques dépendent de l’application.

Les rôles sont définis dans `src/backend/auth/session.js`. Les pages protègent l’accès avec `requireRole(...)` et les routes API vérifient aussi la session et le rôle. `lib/auth.js` est conservé comme réexport de compatibilité.

## Parcours matériel et pannes

1. L’utilisateur envoie une demande depuis son tableau de bord.
2. L’admin accepte ou refuse la demande dans « Demandes d’équipement ».
3. Seuls les équipements ayant une demande `Acceptée` pour l’utilisateur connecté sont proposés dans « Mes déclarations de pannes ».
4. L’API vérifie à nouveau cette acceptation lors de l’enregistrement : masquer un équipement dans l’interface ne suffit pas à protéger la route.
5. Le statut de panne est partagé entre l’admin et l’utilisateur. Les valeurs en base sont `a_faire`, `en_cours` et `termine` ; l’interface les affiche comme « À faire », « En cours » et « Terminé ».

## Gestion du stock

Les administrateurs accèdent à « Gestion du stock » depuis la navigation pour consulter et gérer les produits. Le formulaire « Ajouter un produit » demande la marque, le numéro de bureau, le prix en DH et le stock initial. La marque est obligatoire ; le bureau et le stock doivent être des entiers positifs ou nuls, et le prix un nombre positif ou nul. À la création, le stock initial est également enregistré comme `initialStock`.

La création passe par `POST /backend/GestionProduit/AjouterProduit`, une route réservée aux administrateurs. Les produits sont enregistrés dans le modèle `Product` de Prisma.

Les diagrammes UML de l'application, affichables dans l'aperçu Markdown de VS Code et sur GitHub, sont disponibles dans [docs/diagrammes/gestion-produits.md](./docs/diagrammes/gestion-produits.md). Les sources PlantUML sont aussi disponibles dans [docs/diagrammes/gestion-produits-classes.puml](./docs/diagrammes/gestion-produits-classes.puml) et [docs/diagrammes/gestion-produits-cas-utilisation.puml](./docs/diagrammes/gestion-produits-cas-utilisation.puml).

## Tickets utilisateur

Les tickets suivent le workflow `Ouvert → En cours → Traité → Fermé` (valeurs en base : `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, définies dans `src/shared/ticket-status.js`). L’administrateur passe un ticket à « En cours » puis « Traité » ; l’utilisateur propriétaire peut ensuite le fermer. Chaque changement envoie un e-mail (SMTP) : à l’utilisateur pour « En cours » et « Traité », à l’administrateur pour « Fermé » (`ADMIN_EMAIL`, sinon comptes administrateurs). Un ticket fermé n’accepte plus de messages mais reste consultable. Les transitions métier sont dans `src/backend/features/tickets/ticket.service.js`; la route App Router est une façade.

Les tickets sont distincts des déclarations de pannes. Un utilisateur crée un ticket depuis « Mes tickets » avec un titre, un message et, facultativement, jusqu’à quatre photos ou vidéos (25 Mo au total). Les photos sont limitées à 5 Mo chacune et les vidéos à 20 Mo chacune. Les utilisateurs ne voient que leurs tickets ; les administrateurs voient tous les tickets dans la section « Tickets ».

La migration `prisma/migrations/20261006153500_add_user_tickets_and_attachments/migration.sql` ajoute la relation utilisateur et le stockage des pièces jointes. Les fichiers ne sont accessibles qu’à l’utilisateur propriétaire et aux administrateurs.

## Architecture et intégration

- `app/` conserve les pages, le layout et les Route Handlers; les routes API délèguent leurs méthodes aux handlers backend.
- `src/backend/features/` organise tickets, utilisateurs, auth, produits, demandes, pannes et lectures du tableau admin.
- `src/frontend/features/` contient les panneaux et formulaires par fonctionnalité; `src/frontend/components/` contient la navigation commune.
- `src/backend/db/prisma.js` centralise l’instance Prisma; `prisma/schema.prisma` et les migrations restent inchangés.
- `lib/` expose quelques anciens chemins sous forme de réexports de compatibilité.

Guides détaillés : [ARCHITECTURE_PROJET.md](./ARCHITECTURE_PROJET.md), [ROUTES_API.md](./ROUTES_API.md), [GUIDE_INTEGRATION.md](./GUIDE_INTEGRATION.md) et [DEPENDANCES_MODULES.md](./DEPENDANCES_MODULES.md).

## Notifications e-mail

Le flux de demandes d’équipement et l’ancien formulaire de panne envoient des e-mails à l’utilisateur et aux administrateurs. La page dédiée « Mes déclarations de pannes » n’envoie pas d’e-mail.

L’application envoie les e-mails via Nodemailer/SMTP. Configurer les noms `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` et `MAIL_FROM` dans l’environnement de déploiement. `ADMIN_EMAIL` est facultative; sans elle, les e-mails de clôture de ticket sont envoyés aux comptes admin en base. Sans SMTP complet, le traitement métier continue mais l’envoi peut échouer. Ne pas ajouter de valeurs secrètes à la documentation.