# Dépendances des modules

Variables d’environnement listées par nom uniquement. Aucune valeur secrète n’est documentée ici.

## Dépendances npm

| Module | Dépendances runtime | Dépendances de développement |
| --- | --- | --- |
| App / frontend commun | `next`, `react`, `react-dom`, `lucide-react` | `eslint`, `eslint-config-next`, Tailwind/PostCSS |
| Client API | `axios` | — |
| Auth/utilisateurs | `bcryptjs`, `@prisma/client`, Next.js | `prisma` |
| Tickets | `@prisma/client`, `nodemailer`, `axios`, React/Next | `prisma` |
| Produits | `@prisma/client`, `axios`, React/Next, `lucide-react` | `prisma` |
| Demandes | `@prisma/client`, `nodemailer`, React/Next | `prisma` |
| Pannes/QR | `@prisma/client`, `nodemailer`, `qrcode`, React/Next | `prisma` |
| Shared ticket status | Aucune dépendance tierce | — |

## Modules applicatifs

| Module | Frontend | Backend | Routes conservées | Modèles Prisma et relations | Variables d’environnement |
| --- | --- | --- | --- | --- | --- |
| Session/auth | Pages login, `src/frontend/components/BoutonDeconnexion.jsx` | `src/backend/auth/session.js`, `src/backend/features/authentification/*` | `/api/connexion`, `/api/deconnexion`, `/backend/api/connexion`, `/backend/api/deconnexion` | `User` | `AUTH_SECRET`, `DATABASE_URL` |
| Utilisateurs | `src/frontend/features/utilisateurs/FormulaireCreerUtilisateur.jsx`; la page rapport client reste une page App Router | `src/backend/features/utilisateurs/*` | `/api/utilisateurs`, `/backend/api/utilisateurs`, `/backend/api/utilisateurs/[id]`, `/backend/api/utilisateurs/AfficherUtilisateurs` | `User`; relations de rapport vers demandes, tickets, pannes, messages | `DATABASE_URL`, `AUTH_SECRET` |
| Tickets | `src/frontend/features/tickets/*`, `src/frontend/services/api.js`, `src/shared/statutTicket.js` | `src/backend/features/tickets/*`, session, Prisma, SMTP | `/backend/api/tickets` et sous-routes `id`, `status`, `messages`, `attachments` | `Ticket.user -> User`; `TicketMessage.ticket -> Ticket`, `sender -> User`; attachements liées à ticket/message | `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` |
| Produits | `src/frontend/features/produits/*` | `src/backend/features/produits/*` | `/backend/GestionProduit/AjouterProduit`, `ModifierProduit`, `SupprimerProduit` | `Product`; demandes et pannes liées lors des détails/suppressions | `DATABASE_URL`, `AUTH_SECRET` |
| Demandes équipement | `src/frontend/features/demandes-equipement/*` | `src/backend/features/demandes-equipement/*` | `/backend/api/equipement`, `/backend/api/demandes-equipement`, `/backend/api/demandes-equipement/[id]` | `EquipmentRequest.user -> User`, `product -> Product`; modifie `Product.stock`, `User.equipmentCount` | `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` |
| Pannes | `src/frontend/features/declarations-pannes/*` | `src/backend/features/declarations-pannes/*`, `src/backend/notifications/courriel.js` | `/backend/api/declarations-pannes`, `/backend/api/declarations-pannes/[id]` | `FaultReport.user -> User`, `product -> Product`; `Notification.user -> User`; vérifie EquipmentRequest acceptée | `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` |
| Tableau admin | Page route `app/Gestion_produits/Gestion_roles/admin/page.jsx` | `src/backend/features/tableau-de-bord/tableauBord.queries.js` | URL actuelle du tableau admin | `EquipmentRequest`, `FaultReport`, `Product`, `User` | `DATABASE_URL`, `AUTH_SECRET` |

## Notes sur le schéma

- Schéma : `prisma/schema.prisma`; migrations historiques sous `prisma/migrations/`.
- Le schéma n’a pas été modifié pendant cette migration d’architecture. Ne copiez pas toutes les migrations par défaut dans un projet qui a déjà des tables portant les mêmes noms.
- `TicketAttachment.data` est un champ `Bytes` stocké en base, avec relation optionnelle à `TicketMessage`.
- La suppression actuelle d’un produit retire également demandes et déclarations rattachées. La suppression utilisateur est affectée par les relations/cascades Prisma. Vérifier ces choix de rétention avant d’intégrer l’endpoint de suppression.
- `Notification` est créée lors du changement de statut panne; aucun endpoint de lecture n’est actuellement livré.

## Configuration

Variables observées dans le code : `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `NODE_ENV`. `AUTH_SECRET` a encore une valeur de repli de développement dans le code; le déploiement doit configurer une valeur forte dédiée. `DATABASE_URL` et les identifiants SMTP ne doivent pas être ajoutés à la documentation d’intégration avec leurs valeurs.