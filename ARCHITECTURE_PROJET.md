# Architecture du projet

## Vue d’ensemble

```text
app/                         Entrées App Router : pages et Route Handlers
src/
  frontend/
    components/              Navigation et déconnexion partagées
    services/                Client Axios côté navigateur
    features/                Interfaces par fonctionnalité
  backend/
    auth/                    Session, cookie et rôles
    db/                      Client Prisma unique
    notifications/           Envoi SMTP
    features/                Handlers serveur et lectures métier
  shared/                    Constantes sans accès serveur
lib/                         Réexports de compatibilité vers src/
prisma/                      Schéma PostgreSQL et migrations historiques
```

`app/` reste la racine App Router du projet. Les `page.jsx` et `route.js` spéciaux restent à leur chemin existant afin de préserver les URLs. `src/frontend` et `src/backend` contiennent les implémentations réutilisables. L’alias `@/*` continue de pointer vers la racine; `@frontend/*`, `@backend/*` et `@shared/*` pointent vers les trois domaines source.

## Fichiers et dépendances

| Fichier | Type | Rôle | Dépendances principales | Utilisé par |
| --- | --- | --- | --- | --- |
| `app/layout.jsx` | App Router | Layout racine et navigation selon la session | Session backend, navigation frontend, CSS | Toutes les pages |
| `app/page.jsx` | Page | Page d’accueil actuelle (starter Next.js) | `next/image` | `/` |
| `app/backend/api/tickets/route.js` | Route Handler | Expose GET et POST tickets | `ticket-collection.handler.js` | Clients `/backend/api/tickets` |
| `app/backend/api/tickets/[id]/route.js` | Route Handler | Expose PATCH et DELETE ticket | `ticket-item.handler.js` | Client ticket |
| `app/backend/api/tickets/[id]/messages/route.js` | Route Handler | Expose GET et POST conversation | `ticket-messages.handler.js` | `TicketConversation` |
| `app/backend/api/tickets/[id]/status/route.js` | Route Handler | Parse et valide un changement de statut | Session, service ticket | `TicketConversation` |
| `app/backend/api/tickets/[id]/attachments/[attachmentId]/route.js` | Route Handler | Sert une pièce jointe autorisée | `ticket-attachment.handler.js` | `TicketAttachments` |
| `app/backend/api/users/route.js` | Route Handler | Création d’utilisateur | `users.handler.js` | Formulaire admin et `/api/users` |
| `app/backend/api/users/[id]/route.js` | Route Handler | Rapport, édition et suppression | `user.handler.js` | Gestion des utilisateurs |
| `app/backend/api/users/AfficherUsers/route.js` | Route Handler | Liste admin | `user-list.handler.js` | Gestion des utilisateurs |
| `app/backend/api/equipment/route.js` | Route Handler | Catalogue et matériel accepté | `equipment.handler.js` | Demandes et déclarations de panne |
| `app/backend/api/equipment-requests/route.js` | Route Handler | Consultation et création des demandes | `equipment-requests.handler.js` | Panneaux de demandes |
| `app/backend/api/equipment-requests/[id]/route.js` | Route Handler | Décision admin | `equipment-request.handler.js` | Panneau admin |
| `app/backend/api/fault-reports/route.js` | Route Handler | Consultation et création des pannes | `fault-reports.handler.js` | Panneaux de pannes |
| `app/backend/api/fault-reports/[id]/route.js` | Route Handler | Modification, statut et suppression | `fault-report.handler.js` | Panneaux de pannes |
| `app/backend/api/login/route.js` et `logout/route.js` | Routes Handler | Compatibilité login/logout | Handlers auth backend | Formulaire de connexion et bouton logout |
| `app/api/login/route.js`, `logout/route.js`, `users/route.js` | Routes Handler | Alias API historiques | Réexports des routes backend | Consommateurs `/api/...` |
| `app/backend/GestionProduit/**/route.js` | Route Handler | API produit POST, PUT, DELETE | `product.handler.js` | Formulaires produit |
| `src/backend/auth/session.js` | Backend | Signature/lecture du cookie, redirection et rôles | `next/headers`, `next/navigation`, `node:crypto` | Pages et handlers serveur |
| `src/backend/db/prisma.js` | Backend/DB | Instance Prisma partagée | `@prisma/client`, `DATABASE_URL` | Tous les accès PostgreSQL |
| `src/backend/notifications/email.js` | Backend/notifications | Envoi individuel ou groupé via SMTP | `nodemailer`, variables SMTP | Tickets, demandes, pannes |
| `src/backend/features/auth/login.handler.js`, `logout.handler.js` | Backend/auth | Connexion et fermeture de session | Session, Prisma, `bcryptjs` | Routes auth |
| `src/backend/features/tickets/ticket-collection.handler.js` | Backend/tickets | Liste et création des tickets | Session, Prisma, validation de fichiers | Route collection |
| `src/backend/features/tickets/ticket-item.handler.js` | Backend/tickets | Modification et suppression propriétaire | Session, Prisma, validation de fichiers | Route `[id]` |
| `src/backend/features/tickets/ticket-messages.handler.js` | Backend/tickets | Messages, présence, lecture et pièces jointes | Session, Prisma, validation fichiers | Route `messages` |
| `src/backend/features/tickets/ticket-attachment.handler.js` | Backend/tickets | Téléchargement avec contrôle propriétaire/admin | Session, Prisma | Route pièce jointe |
| `src/backend/features/tickets/ticket.service.js` | Backend/tickets | Transitions atomiques et e-mails de statut | Prisma, règles partagées, SMTP | Route statut |
| `src/backend/features/tickets/ticket-attachments.js` | Backend/tickets | Formats, limites et signatures de fichiers | Web `File`/`Uint8Array` | Création/édition/messages |
| `src/shared/ticket-status.js` | Shared | Statuts, libellés, styles et transitions permises | Aucune dépendance serveur | UI et service ticket |
| `src/frontend/services/api.js` | Frontend/service | Client Axios avec base `/backend/api` | `axios` | Formulaires et panneaux client |
| `src/frontend/features/tickets/*` | Frontend/tickets | Conversation, listes, statuts et médias | React, API frontend, `@shared/ticket-status` | Pages admin/utilisateur ticket |
| `src/backend/features/users/*` | Backend/utilisateurs | Création, liste, rapport, modification, suppression | Prisma, session, `bcryptjs` | Routes utilisateurs |
| `src/frontend/features/users/CreateUserForm.jsx` | Frontend/utilisateurs | Création de comptes admin | React, API frontend | Page admin d’ajout |
| `src/backend/features/products/product.handler.js` | Backend/produits | Création, édition, suppression de produits | Prisma, session | Routes produits |
| `src/backend/features/products/product.queries.js` | Backend/produits | Lectures catalogue, détail et affectations | Prisma | Pages serveur produit |
| `src/frontend/features/products/*` | Frontend/produits | Formulaires et suppression | React, Axios, Next navigation | Pages produits |
| `src/backend/features/equipment-requests/*` | Backend/demandes | Liste, création, décision, catalogue et lectures admin | Prisma, session, SMTP | Routes demandes et pages serveur |
| `src/frontend/features/equipment-requests/*` | Frontend/demandes | Formulaire utilisateur et décision admin | React, Fetch | Pages utilisateur/admin |
| `src/backend/features/fault-reports/*` | Backend/pannes | Consultation, création, édition, statut, suppression et notifications | Prisma, SMTP, `qrcode` | Routes pannes |
| `src/frontend/features/fault-reports/*` | Frontend/pannes | Déclaration et tableau admin/QR imprimable | React, API frontend, `qrcode` | Pages utilisateur/admin |
| `src/backend/features/dashboard/dashboard.queries.js` | Backend/tableau | Agrégats et activité du tableau admin | Prisma | Page admin |
| `src/frontend/components/AppNavigation.jsx`, `LogoutButton.jsx` | Frontend partagé | Navigation par rôle et déconnexion | React, Next navigation, Lucide | Layout racine |
| `lib/auth.js`, `prisma.js`, `email.js`, `axios.js`, `ticket-status.js`, `ticket-attachments.js` | Compatibilité | Réexportent les implémentations source | Module correspondant sous `src/` | Anciens imports internes/externes |
| `prisma/schema.prisma` | Base de données | Modèles PostgreSQL et relations Prisma | `DATABASE_URL`, Prisma | Backend |
| `prisma/migrations/*/migration.sql` | Base de données | Historique versionné du schéma | PostgreSQL | Déploiement Prisma, pas les pages |
| `jsconfig.json` | Configuration | Alias JavaScript | Aucun | Next.js et éditeur |

## Inventaire nominatif des modules source

| Fichier | Type et rôle | Dépendances | Utilisé par |
| --- | --- | --- | --- |
| `src/backend/auth/session.js` | Backend : cookie signé et rôles | Next headers/navigation, crypto, `AUTH_SECRET` | Pages et handlers serveur |
| `src/backend/db/prisma.js` | Backend/DB : client Prisma singleton | `@prisma/client`, `DATABASE_URL` | Tous les accès PostgreSQL |
| `src/backend/notifications/email.js` | Backend : envoi SMTP | `nodemailer`, variables SMTP | Tickets, demandes, pannes |
| `src/backend/features/auth/login.handler.js` | Backend : connexion | Session, Prisma, `bcryptjs` | Route login |
| `src/backend/features/auth/logout.handler.js` | Backend : fermeture session | Session | Route logout |
| `src/backend/features/dashboard/dashboard.queries.js` | Backend : agrégats admin | Prisma | Page admin |
| `src/backend/features/equipment-requests/equipment.handler.js` | Backend : catalogue et matériel attribué | Session, Prisma | Route equipment |
| `src/backend/features/equipment-requests/equipment-requests.handler.js` | Backend : collection demandes et flux panne historique | Session, Prisma, SMTP | Route equipment-requests |
| `src/backend/features/equipment-requests/equipment-request.handler.js` | Backend : décision admin/stock transactionnel | Session, Prisma, SMTP | Route equipment-requests/[id] |
| `src/backend/features/equipment-requests/equipment-request.queries.js` | Backend : données page admin | Prisma | Page demandes admin |
| `src/backend/features/fault-reports/fault-reports.handler.js` | Backend : liste/création de panne | Session, Prisma | Route fault-reports |
| `src/backend/features/fault-reports/fault-report.handler.js` | Backend : édition/statut/suppression, Notification et QR | Session, Prisma, SMTP, `qrcode` | Route fault-reports/[id] |
| `src/backend/features/products/product.handler.js` | Backend : mutations produit | Session, Prisma | Routes GestionProduit |
| `src/backend/features/products/product.queries.js` | Backend : catalogue/détail/affectations | Prisma | Pages serveur produit |
| `src/backend/features/tickets/ticket-attachments.js` | Backend : validation fichiers | `File`, `Uint8Array` | Handlers tickets |
| `src/backend/features/tickets/ticket-collection.handler.js` | Backend : liste/création ticket | Session, Prisma, validation fichiers | Route tickets |
| `src/backend/features/tickets/ticket-item.handler.js` | Backend : édition/suppression propriétaire | Session, Prisma, validation fichiers | Route tickets/[id] |
| `src/backend/features/tickets/ticket-messages.handler.js` | Backend : conversation, présence, lecture | Session, Prisma, validation fichiers | Route messages |
| `src/backend/features/tickets/ticket-attachment.handler.js` | Backend : téléchargement autorisé | Session, Prisma | Route attachment |
| `src/backend/features/tickets/ticket.service.js` | Backend : transitions atomiques et e-mails | Prisma, statut partagé, SMTP | Route status |
| `src/backend/features/users/users.handler.js` | Backend : création admin | Session, Prisma, `bcryptjs` | Route users collection |
| `src/backend/features/users/user.handler.js` | Backend : rapport/édition/suppression admin | Session, Prisma, `bcryptjs` | Route users/[id] |
| `src/backend/features/users/user-list.handler.js` | Backend : liste admin | Session, Prisma | Route AfficherUsers |
| `src/frontend/components/AppNavigation.jsx` | Frontend partagé : navigation par rôle | React, Next navigation, Lucide | Layout racine |
| `src/frontend/components/LogoutButton.jsx` | Frontend partagé : déconnexion | React, Next navigation, Lucide | Navigation |
| `src/frontend/services/api.js` | Frontend service : Axios `/backend/api` | Axios | Formulaires/panneaux client |
| `src/frontend/features/tickets/TicketConversation.jsx` | Frontend : messages, statuts, présence | React, API et composants tickets | Panneaux tickets |
| `src/frontend/features/tickets/TicketAttachments.jsx` | Frontend : rendu médias joints | Next Image | Conversation |
| `src/frontend/features/tickets/TicketStatusBadge.jsx` | Frontend : badge de statut | Shared ticket status | Listes/conversation |
| `src/frontend/features/tickets/AdminTicketsPanel.jsx` | Frontend : gestion admin des tickets | React, API, composants tickets | Page admin tickets |
| `src/frontend/features/tickets/UserTicketsPanel.jsx` | Frontend : tickets utilisateur | React, API, composants tickets | Page utilisateur tickets |
| `src/frontend/features/users/CreateUserForm.jsx` | Frontend : création de compte admin | React, API | Page ajout utilisateur |
| `src/frontend/features/products/ProductCreateForm.jsx` | Frontend : création produit | React, Axios | Page ajout produit |
| `src/frontend/features/products/EditProductForm.jsx` | Frontend : édition produit | React, Axios, Next navigation | Page édition produit |
| `src/frontend/features/products/DeleteProductButton.jsx` | Frontend : confirmation de suppression | React, Axios, Next navigation, Lucide | Catalogue produits |
| `src/frontend/features/equipment-requests/EquipmentRequestPanel.jsx` | Frontend : demande utilisateur | React, Fetch | Dashboard utilisateur |
| `src/frontend/features/equipment-requests/EquipmentRequestsPanel.jsx` | Frontend : décision admin | React, Fetch | Page demandes admin |
| `src/frontend/features/fault-reports/FaultReportPanel.jsx` | Frontend : déclaration/historique utilisateur | React, API | Page pannes utilisateur |
| `src/frontend/features/fault-reports/FaultReportsPanel.jsx` | Frontend : traitement admin et ticket QR imprimable | React, API, `qrcode`, Next Image | Page pannes admin |
| `src/shared/ticket-status.js` | Shared : statuts et transitions sans dépendance serveur | Aucune | UI et service ticket |

Exemple : la page ticket admin reste sous `app/products_frontend/.../tickets/page.jsx`, vérifie son rôle, puis affiche `src/frontend/features/tickets/AdminTicketsPanel.jsx`. Le panneau appelle `/backend/api/tickets`; son Route Handler délègue à `src/backend/features/tickets/ticket-collection.handler.js`, qui utilise session et Prisma.

## Modèles et relations

- `User` est relié aux `Ticket`, `TicketMessage`, `EquipmentRequest`, `FaultReport` et `Notification`.
- `Ticket` peut avoir un propriétaire `User`; il contient des `TicketMessage` et des `TicketAttachment`.
- `TicketMessage` appartient à un `Ticket`, peut référencer un expéditeur `User`, et peut avoir des pièces jointes.
- `TicketAttachment` référence un ticket et peut référencer un message; les octets du fichier sont stockés en base.
- `Product` est référencé par `EquipmentRequest` et `FaultReport`.
- `EquipmentRequest` relie `User` et `Product`; son acceptation met à jour le stock et le compteur utilisateur dans une transaction.
- `FaultReport` relie `User` et `Product`; les changements de statut créent un `Notification`.

Aucune modification du schéma ou des migrations n’a été réalisée pendant la restructuration.