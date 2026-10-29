# Guide d’intégration

Ce projet ne fournit pas encore de package autonome par module. Pour intégrer une fonction dans un autre Next.js, copier ses fichiers source avec leurs dépendances, réutiliser ou adapter les Route Handlers, puis intégrer les modèles Prisma requis. Les points d’entrée de l’application actuelle ne doivent pas être copiés si leurs chemins entrent en conflit avec le projet hôte.

## Préparation commune

1. Vérifier la version Next.js et conserver ses règles App Router locales. Les `page.jsx` et `route.js` spéciaux restent sous `app/` ou `src/app/`.
2. Copier le module demandé depuis `src/frontend/`, `src/backend/` et, si nécessaire, `src/shared/`.
3. Ajouter les alias `@backend/*`, `@frontend/*`, `@shared/*`, ou adapter tous les imports à l’alias du projet hôte. Les anciens `lib/*.js` de ce dépôt ne sont que des réexports de compatibilité.
4. Reprendre uniquement les champs et relations nécessaires de `prisma/schema.prisma`; fusionner le schéma avec celui du projet principal. Générer et relire une migration additive dans l’environnement cible; ne pas lancer de reset.
5. Configurer les variables requises par nom dans les secrets du projet hôte. Ne pas réutiliser la valeur de repli de développement pour `AUTH_SECRET`.
6. Faire correspondre l’authentification; tester les accès autorisés et refusés pour chaque rôle avant d’exposer l’interface.

## Modules

### Tickets et conversations

- Frontend : `src/frontend/features/tickets/` et `src/frontend/services/api.js`; dépend du statut partagé `src/shared/ticket-status.js`.
- Backend : `src/backend/features/tickets/`, `src/backend/auth/session.js`, `src/backend/db/prisma.js`, `src/backend/notifications/email.js`.
- Routes à ajouter : `/api/tickets`, `/api/tickets/[id]`, `/api/tickets/[id]/status`, `/api/tickets/[id]/messages`, `/api/tickets/[id]/attachments/[attachmentId]` (adapter les URL dans le service frontend si le préfixe change).
- Prisma : `User`, `Ticket`, `TicketMessage`, `TicketAttachment`; conserver leurs clés étrangères, `adminReadAt`, `userReadAt`, `lastSeenAt` et les index associés.
- NPM : `next`, `react`, `axios`, `@prisma/client`, `nodemailer`; `prisma` en développement. Pas de bibliothèque de stockage externe : les octets restent en base.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `ADMIN_EMAIL`.
- Auth : fournir `getSession()` avec `id`, `name`, `email`, `user_role`; conserver les rôles exacts `admin` et `utilisateur` ainsi que le contrôle propriétaire.
- Conflits : préfixe API déjà utilisé par le projet hôte, noms des modèles `Ticket`/`User`, format des statuts et éventuelle stratégie différente pour les pièces jointes.
- Tests : lister pour deux rôles, créer ticket et message, vérifier transitions valides et invalides, fermer, vérifier refus d’écriture, tester accès au fichier par propriétaire/admin/autre utilisateur et limites de format/taille.

### Authentification et utilisateurs

- Frontend : `src/frontend/features/users/CreateUserForm.jsx`; pages de connexion et rapport utilisateur sont des entrées/écrans sous `app/products_frontend/...` et peuvent nécessiter une adaptation propre au projet hôte.
- Backend : `src/backend/auth/session.js`, `src/backend/features/auth/`, `src/backend/features/users/`, `src/backend/db/prisma.js`.
- Routes : login/logout, `/api/users`, `/api/users/[id]` et route de liste admin `/api/users/AfficherUsers`; choisir un chemin unique ou garder des façades de compatibilité.
- Prisma : `User`; les rapports d’utilisateur incluent également demandes, tickets et pannes, donc les relations correspondantes sont requises pour cette vue.
- NPM : `next`, `react`, `bcryptjs`, `@prisma/client`; `prisma` en développement.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`.
- Auth : le projet hôte doit fournir un cookie signé ou adapter `getSession`, `setSession`, `clearSession`, `requireRole`; éviter d’avoir deux autorités de session.
- Conflits : colonnes `user_role`, email unique, mode de hachage du mot de passe, politiques de suppression/cascade.
- Tests : vérifier hachage et login invalide, cookie HTTP-only, expiration, chaque rôle, refus d’un non-admin et suppression interdite de son propre compte.

### Produits et stock

- Frontend : `src/frontend/features/products/`.
- Backend : `src/backend/features/products/`, `src/backend/db/prisma.js`, `src/backend/auth/session.js`.
- Routes : garder les URLs historiques `/backend/GestionProduit/AjouterProduit`, `/ModifierProduit`, `/SupprimerProduit` ou mettre à jour les appels frontend et ajouter des alias.
- Prisma : `Product`; pour le détail d’affectation et les suppressions liées, `EquipmentRequest`, `FaultReport` et `User` sont également requis.
- NPM : `next`, `react`, `axios`, `lucide-react`, `@prisma/client`; `prisma` en développement.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`.
- Auth : appliquer le rôle admin au niveau pages et handlers.
- Conflits : champs locaux de produit (`marque`, `bureau`, `prix`, `stock`, `initialStock`) et règles locales de stock. La suppression actuelle efface les demandes et déclarations liées; ne pas importer ce comportement sans décision de rétention.
- Tests : création/modification, droits non-admin, cohérence du stock, affichage des affectations; test de suppression uniquement sur base de test et avec vérification explicite des cascades.

### Demandes d’équipement

- Frontend : `src/frontend/features/equipment-requests/`.
- Backend : `src/backend/features/equipment-requests/`, auth, Prisma et notifications e-mail.
- Routes : `/backend/api/equipment`, `/backend/api/equipment-requests`, `/backend/api/equipment-requests/[id]`.
- Prisma : `EquipmentRequest`, `Product`, `User`; le stock et `User.equipmentCount` sont modifiés dans une transaction lors de l’acceptation.
- NPM : `next`, `react`, `@prisma/client`, `nodemailer`; `prisma` en développement.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`.
- Auth : reproduire le filtrage admin/global et utilisateur/propriétaire; la décision est réservée à l’admin.
- Conflits : libellés de statut en français et mode historique `requestType: "panne"` encore accepté ici.
- Tests : demande en stock nul, acceptation concurrente, décrément du stock une fois, refus, isolation des listes, mails configurés/absents.

### Déclarations de panne et notifications

- Frontend : `src/frontend/features/fault-reports/`.
- Backend : `src/backend/features/fault-reports/`, `src/backend/notifications/email.js`, auth et Prisma.
- Routes : `/backend/api/fault-reports`, `/backend/api/fault-reports/[id]`; `equipment` sert à choisir le produit accepté.
- Prisma : `FaultReport`, `Notification`, `EquipmentRequest`, `Product`, `User`.
- NPM : `next`, `react`, `axios`, `qrcode`, `nodemailer`, `@prisma/client`; `prisma` en développement.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`.
- Auth : l’utilisateur ne peut signaler une panne que sur un produit avec demande acceptée; l’admin change le statut.
- Conflits : statuts `a_faire`, `en_cours`, `termine`; l’API dédiée ne fournit pas de lecture des notifications. Le changement de statut crée une notification DB et envoie un e-mail avec QR.
- Tests : association au produit accepté, propriété lors d’édition/suppression, rôle admin pour statut, création de notification, email/QR avec et sans SMTP.

### Tableau administrateur

- Backend : `src/backend/features/dashboard/dashboard.queries.js`.
- Frontend : page route actuelle `app/products_frontend/Gestion_role/admin/page.jsx`.
- Prisma : `EquipmentRequest`, `FaultReport`, `Product`, `User`.
- Environnement : `DATABASE_URL`, `AUTH_SECRET`.
- Tests : vérifier agrégats avec jeu de données contrôlé et restriction au rôle admin.

## Vérification après intégration

Lancer les scripts du projet hôte (lint, build, tests) et `npx prisma validate`. Vérifier l’inventaire des routes après build, puis tester les parcours avec les rôles réellements employés. Les appels PostgreSQL, SMTP et QR nécessitent des services/configurations valides; un build réussi ne les teste pas.