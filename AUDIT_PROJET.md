# Audit du projet Gestion des Tickets

## Portée et état

Audit statique du workspace visible (101 fichiers indexés par l’inventaire, dont fichiers d’application, configuration, documentation, migrations et fichiers d’instructions). Les fichiers secrets `.env` et `.env.local` n’ont pas été ouverts ni copiés dans ce document. Aucun fichier applicatif, schéma ou migration n’a été modifié.

Les chemins d’URL indiqués ci-dessous sont déduits de l’App Router actuel : les fichiers sous `app/backend/...` génèrent des URL sous `/backend/...`. Les observations de rôle décrivent les vérifications trouvées dans le code; elles ne constituent pas un test d’exécution des routes.

## Architecture actuelle

- `app/` est la racine App Router (pas de répertoire `src/`). Les pages, composants partagés, endpoints et dossiers de fonctionnalités cohabitent sous ce répertoire.
- `app/products_frontend/` contient les pages et composants React des tableaux de bord, utilisateurs, tickets, produits, demandes d’équipement et pannes. Plusieurs `page.jsx` sont des Server Components qui lisent directement Prisma.
- `app/backend/api/` contient la plupart des Route Handlers Next.js. Ce sont des routes HTTP, pas une couche de services métier séparée.
- `app/backend/GestionProduit/` contient les Route Handlers de produits. Le fichier `route.js` à la racine de ce dossier est actuellement vide (`export {}`); les handlers fonctionnels sont dans ses sous-dossiers.
- `app/api/` contient trois routes de compatibilité qui réexportent les handlers de connexion, déconnexion et création utilisateur existants.
- `app/components/` regroupe navigation, déconnexion et composants de tickets partagés.
- `lib/` contient l’instance Prisma, la session signée par cookie, le client Axios, l’envoi SMTP, la validation des pièces jointes et les règles de statut des tickets.
- `prisma/schema.prisma` et les 13 migrations répertoriées décrivent les tables et leur évolution PostgreSQL.
- Les fichiers racine fournissent les scripts, alias et configurations Next.js, ESLint, Tailwind et Prisma. `docs/diagrammes/` contient la documentation UML orientée produits.

## Fonctionnalités présentes

1. Authentification par e-mail/mot de passe avec `bcryptjs`, cookie HTTP-only `ticket_session` et rôles `admin`, `utilisateur`, `responsable` (`lib/auth.js`). Les pages protégées emploient `requireRole`; plusieurs handlers vérifient le rôle à nouveau.
2. Gestion des utilisateurs : création, consultation d’un rapport, modification, suppression et liste réservées aux administrateurs.
3. Gestion des tickets : création, liste par rôle/propriétaire, modification et suppression par l’utilisateur, transitions de statut, conversations, présence/lecture, réponses automatiques et notification e-mail.
4. Pièces jointes de tickets et messages : contrôle des formats par signature de fichier, limites de taille/nombre, stockage des octets dans PostgreSQL et téléchargement avec vérification d’accès.
5. Gestion du stock de produits : affichage, création, modification et suppression réservés côté API à l’administrateur.
6. Demandes d’équipement : consultation, soumission, décision admin, décrément du stock et mise à jour du compteur utilisateur dans une transaction.
7. Déclarations de panne : création et édition par l’utilisateur sur un produit accepté, consultation et transition d’état par admin, notification en base, e-mail SMTP avec QR code. Il existe aussi une voie de compatibilité « panne » dans l’API de demandes d’équipement.
8. Navigation par rôle et pages dédiées aux espaces administrateur, utilisateur et responsable.

## Routes Next.js et API

Les pages sont conservées sous les chemins actuels. Pages reconnues dans l’inventaire :

| URL | Fichier |
| --- | --- |
| `/` | `app/page.jsx` (page d’accueil générique du starter Next.js) |
| `/products_frontend/Gestion_role/login` | `app/products_frontend/Gestion_role/login/page.jsx` |
| `/products_frontend/Gestion_role/admin` | `app/products_frontend/Gestion_role/admin/page.jsx` |
| `/products_frontend/Gestion_role/admin/ajouter-utilisateur` | `app/products_frontend/Gestion_role/admin/ajouter-utilisateur/page.jsx` |
| `/products_frontend/Gestion_role/admin/demandes-equipement` | `app/products_frontend/Gestion_role/admin/demandes-equipement/page.jsx` |
| `/products_frontend/Gestion_role/admin/declarations-pannes` | `app/products_frontend/Gestion_role/admin/declarations-pannes/page.jsx` |
| `/products_frontend/Gestion_role/admin/tickets` | `app/products_frontend/Gestion_role/admin/tickets/page.jsx` |
| `/products_frontend/Gestion_role/responsable` | `app/products_frontend/Gestion_role/responsable/page.jsx` |
| `/products_frontend/Gestion_role/utilisateur` | `app/products_frontend/Gestion_role/utilisateur/page.jsx` |
| `/products_frontend/Gestion_role/utilisateur/declarations-pannes` | `app/products_frontend/Gestion_role/utilisateur/declarations-pannes/page.jsx` |
| `/products_frontend/Gestion_role/utilisateur/tickets` | `app/products_frontend/Gestion_role/utilisateur/tickets/page.jsx` |
| `/products_frontend/Gestion_product/AffichageProduit` | `app/products_frontend/Gestion_product/AffichageProduit/page.jsx` |
| `/products_frontend/Gestion_product/AffichageProduit/[id]` | `app/products_frontend/Gestion_product/AffichageProduit/[id]/page.jsx` |
| `/products_frontend/Gestion_product/AjouterProduit` | `app/products_frontend/Gestion_product/AjouterProduit/page.jsx` |
| `/products_frontend/Gestion_product/ModifierProduit` | `app/products_frontend/Gestion_product/ModifierProduit/page.jsx` |
| `/products_frontend/User/AfficherUser` | `app/products_frontend/User/AfficherUser/page.jsx` |

| Endpoint | Méthodes | Accès constaté |
| --- | --- | --- |
| `/backend/api/login` | `POST` | Public; vérifie les identifiants puis crée la session. |
| `/backend/api/logout` | `POST` | Efface la session. |
| `/api/login` | `POST` | Réexport du handler `/backend/api/login`. |
| `/api/logout` | `POST` | Réexport du handler `/backend/api/logout`. |
| `/api/users` | `POST` | Réexport de la création d’utilisateur admin. |
| `/backend/api/users` | `POST` | Admin; crée un utilisateur. |
| `/backend/api/users/[id]` | `GET`, `PATCH`, `DELETE` | Admin; rapport, modification et suppression d’utilisateur. |
| `/backend/api/users/AfficherUsers` | `GET` | Admin; liste des utilisateurs. |
| `/backend/api/tickets` | `GET`, `POST` | Session requise; liste filtrée par propriétaire sauf admin; création limitée aux rôles utilisateur/admin. |
| `/backend/api/tickets/[id]` | `PATCH`, `DELETE` | Utilisateur propriétaire uniquement. |
| `/backend/api/tickets/[id]/status` | `PATCH` | Admin ou utilisateur propriétaire; transitions imposées par rôle et statut. |
| `/backend/api/tickets/[id]/messages` | `GET`, `POST` | Admin ou utilisateur propriétaire; pas de nouveau message si fermé. |
| `/backend/api/tickets/[id]/attachments/[attachmentId]` | `GET` | Session requise; propriétaire ou admin. |
| `/backend/api/equipment` | `GET` | Session requise; catalogue ou matériel accepté pour mode panne. |
| `/backend/api/equipment-requests` | `GET`, `POST` | Session requise; lecture admin globale ou utilisateur propre; création de demande, avec compatibilité panne. |
| `/backend/api/equipment-requests/[id]` | `PATCH` | Admin; accepter/refuser, traitement du stock transactionnel. |
| `/backend/api/fault-reports` | `GET`, `POST` | Session requise; lecture filtrée; création réservée à l’utilisateur. |
| `/backend/api/fault-reports/[id]` | `PATCH`, `DELETE` | Utilisateur propriétaire pour édition/suppression; admin pour le changement de statut. |
| `/backend/GestionProduit/AjouterProduit` | `POST` | Admin. |
| `/backend/GestionProduit/ModifierProduit` | `PUT` | Admin. |
| `/backend/GestionProduit/SupprimerProduit` | `DELETE` | Admin. |
| `/backend/GestionProduit` | Aucun handler HTTP | `app/backend/GestionProduit/route.js` ne contient que `export {}`; probablement résidu sans endpoint actif. |

`GET`, `PUT` et `DELETE` ne sont pas définis pour les collections/ressources où ils ne figurent pas dans ce tableau. Aucun changement de méthode ni d’URL n’est recommandé avant de vérifier les consommateurs réels.

## Dépendances entre fichiers et données

| Domaine | Frontend / pages | API / logique actuelle | Modèles Prisma et relations |
| --- | --- | --- | --- |
| Authentification | `app/products_frontend/Gestion_role/login/page.jsx`, `app/components/LogoutButton.jsx`, `app/components/AppNavigation.jsx` | `app/backend/api/login/route.js`, `app/backend/api/logout/route.js`, `app/api/login/route.js`, `app/api/logout/route.js`, `lib/auth.js` | `User` |
| Utilisateurs | `app/products_frontend/Gestion_role/admin/ajouter-utilisateur/page.jsx`, `CreateUserForm.jsx`, `app/products_frontend/User/AfficherUser/page.jsx` | `app/backend/api/users/route.js`, `app/backend/api/users/[id]/route.js`, `AfficherUsers/route.js`, réexport `app/api/users/route.js`; `lib/auth.js` | `User` relié à demandes, pannes, tickets, messages et notifications |
| Tickets | Pages `admin/tickets` et `utilisateur/tickets`, panneaux `AdminTicketsPanel.jsx` / `UserTicketsPanel.jsx`, `app/components/TicketConversation.jsx`, `TicketStatusBadge.jsx` | Handlers `app/backend/api/tickets/**`; `lib/ticket-status.js`, `lib/ticket-attachments.js`, `lib/email.js`, `lib/auth.js`, `lib/prisma.js`, `lib/axios.js` | `Ticket` appartient facultativement à `User`; `TicketMessage` appartient à `Ticket` et facultativement à `User`; `TicketAttachment` appartient à `Ticket` et facultativement à `TicketMessage` |
| Produits / stock | Pages `app/products_frontend/Gestion_product/**`, `DeleteProductButton.jsx` | Handlers `app/backend/GestionProduit/**`; appels Axios directs | `Product` est relié à `EquipmentRequest` et `FaultReport` |
| Demandes d’équipement | Pages utilisateur et admin; `EquipmentRequestPanel.jsx`, `EquipmentRequestsPanel.jsx` | `app/backend/api/equipment*/**`; `lib/email.js`, `lib/auth.js`, `lib/prisma.js` | `EquipmentRequest` relie `User` et `Product`; le traitement modifie également `Product.stock` et `User.equipmentCount` |
| Pannes | Pages utilisateur/admin; `FaultReportPanel.jsx`, `FaultReportsPanel.jsx` | `app/backend/api/fault-reports/**`; compatibilité dans `equipment-requests`; `lib/email.js`, `lib/auth.js`, `lib/prisma.js`, `qrcode` | `FaultReport` relie `User` et `Product`; `Notification` appartient à `User` |

L’alias `@/*` est configuré vers la racine (`jsconfig.json`). Le client Axios de `lib/axios.js` cible `/backend/api`; les quelques `fetch` directs reprennent explicitement ce préfixe. Les composants client utilisent `lib/axios.js`, `lib/ticket-status.js` et les composants partagés. Aucun import Prisma n’a été relevé dans les composants explicitement marqués comme composants client; en revanche, plusieurs pages serveur Prisma sont directement, ce qui empêche de les extraire comme simples composants frontend.

## Problèmes et risques détectés

1. **Mélange des responsabilités** : `app/backend/api/**/route.js` contient simultanément transport HTTP, vérification de session, validation, règles métier, accès Prisma, e-mail et parfois QR code. Il n’existe pas de repository/service/validation par domaine.
2. **Frontend lié au backend** : les pages serveur de produits, du tableau admin et des demandes lisent Prisma directement. Les composants client sont davantage découplés, mais leurs URL sont souvent codées en dur.
3. **Routes API publiques historiques** : les routes `/backend/api/...` sont réellement appelées par le frontend. `/api/login`, `/api/logout` et `/api/users` réexportent certaines opérations. Les remplacer ou déplacer les Route Handlers sans façades casserait des consommateurs.
4. **Routes de produits distinctes** : les endpoints `/backend/GestionProduit/...` ne suivent pas le segment `/backend/api`; les formulaires frontend les appellent directement.
5. **Protection de pages inégale** : des pages comme `app/products_frontend/Gestion_product/AffichageProduit/page.jsx` et `ModifierProduit/page.jsx` accèdent à Prisma sans `requireRole` constaté, alors que le menu les cache aux non-admins. Les APIs de mutation produit vérifient le rôle, mais la protection de navigation ne devrait pas dépendre du menu.
6. **Secret de session de repli** : `lib/auth.js` utilise une valeur de développement fixe lorsque `AUTH_SECRET` est absent. `.env.example` ne documente pas cette variable. La configuration de production doit imposer un secret propre à l’environnement avant toute intégration.
7. **Documentation e-mail incohérente** : `lib/email.js` emploie Nodemailer et les variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `MAIL_FROM`; `README.md` mentionne aussi Resend et `EMAIL_FROM`. Le code courant et `.env.example` indiquent le flux SMTP comme effectif.
8. **Voies de panne qui se recouvrent** : les routes dédiées `/backend/api/fault-reports` coexistent avec un chemin historique `requestType: "panne"` dans `/backend/api/equipment-requests`. Le second chemin n’a pas été trouvé dans les appels frontend actuels; il est documenté comme compatibilité, à confirmer avant retrait.
9. **Suppression métier destructive existante** : la suppression produit efface aussi les demandes d’équipement et signalements liés; la suppression d’un utilisateur peut entraîner des suppressions par cascade prévues au schéma. Ce comportement doit être préservé pendant une simple restructuration et testé séparément avant toute évolution métier.
10. **Validation d’entrée produit incomplète côté serveur** : la création produit convertit les champs mais n’applique pas les vérifications explicites visibles dans la modification. Une correction serait une évolution de sécurité distincte, à isoler pour ne pas modifier silencieusement le périmètre métier.
11. **Organisation et noms** : `products_frontend` est sous `app/` malgré son rôle métier, et `SuppimeProduit` contient une faute historique dans son chemin. Renommer ces chemins pourrait casser les imports ou les URL; ce n’est pas requis pour modulariser les modules.
12. **Résidus candidats, pas suppressions proposées** : `app/backend/GestionProduit/route.js` n’exporte aucun handler et `app/page.jsx` affiche encore la page starter. Ils sont repérés, mais leur suppression/remplacement n’est pas incluse sans décision explicite.
13. **Pas de tests automatisés repérés** : aucun fichier `*.test.*` ou `*.spec.*` n’a été trouvé. Les contrôles disponibles reposent pour l’instant sur ESLint, validation Prisma et build.

## Inventaire technique utile

- Scripts : `dev` (`next dev --webpack`), `build`, `start`, `lint`. Aucun script de test.
- Dépendances runtime déclarées : Next.js, React, `@prisma/client`, `axios`, `bcryptjs`, `nodemailer`, `qrcode`, `lucide-react`.
- Dépendances de développement : Prisma CLI, ESLint, `eslint-config-next`, Tailwind CSS et son plugin PostCSS.
- Configurations : `next.config.mjs`, `jsconfig.json` (`@/*` vers racine), `eslint.config.mjs`, `postcss.config.mjs`, `prisma.config.mjs`.
- Variables réellement lues par le code : `DATABASE_URL`, `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `ADMIN_EMAIL`, `NODE_ENV`. Seuls les noms sont listés; aucune valeur secrète n’est incluse.
- Modèles Prisma : `User`, `Ticket`, `TicketMessage`, `TicketAttachment`, `Product`, `EquipmentRequest`, `FaultReport`, `Notification`. Les relations et clés étrangères sont définies dans `prisma/schema.prisma`; aucune modification du schéma n’est nécessaire pour le plan proposé.
- Migrations inventoriées : 13 sous `prisma/migrations/`. La migration la plus récente supprime l’ancien modèle `Equipment`; le README avertit que son application supprime les données encore présentes dans cette table. Aucune migration ne sera lancée pendant une restructuration de fichiers.
- Documentation existante : `README.md`, diagrammes PlantUML et leur présentation sous `docs/diagrammes/`.

## Plan de migration proposé

Le principe directeur est de préserver les fichiers spéciaux et leur chemin dans `app/`. Les `page.jsx` et `route.js` resteront donc des points d’entrée App Router. Les dossiers de fonctionnalités existants peuvent être renommés ou déplacés seulement après extraction locale et mise à jour des références; aucune migration massive vers `src/` n’est recommandée. Les routes actuelles seront conservées et pourront devenir des façades minces qui appellent la logique métier.

1. **Étape A — sécurité et baseline** : lire les guides Next.js 16 présents dans les dépendances avant toute modification de code; confirmer les chemins consommateurs avec recherches d’imports; garder la validation et la logique actuelles. Ne pas modifier le schéma ni les données.
2. **Étape B — tickets** : extraire progressivement les opérations/validations de `app/backend/api/tickets/**` vers un domaine serveur `backend/features/tickets/` (services, accès aux données et validation selon les frontières réellement utiles). Conserver les Route Handlers, URL, méthodes et réponses HTTP. Déplacer ensuite les composants `TicketConversation`, `TicketAttachments`, `TicketStatusBadge` et panneaux vers `frontend/features/tickets/`, en gardant les pages `app/.../page.jsx` comme entrées. Le module partagé de statuts doit rester importable côté client et serveur, sans importer Prisma.
3. **Étape C — demandes et pannes** : traiter séparément `equipment-requests` puis `fault-reports`; préserver transactions, statuts, rôles, notifications, e-mails, QR code et la compatibilité identifiée jusqu’à vérification de ses consommateurs. Maintenir les pages Next.js à leurs URL actuelles.
4. **Étape D — produits et utilisateurs** : extraire les accès Prisma des Route Handlers et pages serveur concernés; conserver les routes historiques produit et les réexports `/api/users`; déplacer seulement les composants frontend réutilisables. Documenter explicitement les cascades et comportements de suppression existants.
5. **Étape E — socle** : ranger l’authentification, Prisma et l’e-mail derrière une frontière serveur claire (par exemple `backend/auth`, `backend/lib`), sans exposer ces imports au client; garder un seul client Prisma et une seule implémentation e-mail. Garder `shared/` uniquement pour les constantes et fonctions réellement sans dépendance serveur.
6. **À chaque module** : lister ses fichiers/dépendances; faire un changement ciblé; contrôler imports et alias, puis lancer au minimum ESLint et build; valider les URL/méthodes par comparaison à la matrice ci-dessus. N’avancer au module suivant qu’après succès ou explication d’un blocage.
7. **Documentation finale** : après les décisions de migration, créer `ARCHITECTURE_PROJET.md`, `ROUTES_API.md`, `GUIDE_INTEGRATION.md` et `DEPENDANCES_MODULES.md` à partir des fichiers réellement déplacés et des dépendances confirmées. Ne pas recopier des variables secrètes; lister uniquement leurs noms.

### Contrôles de référence effectués

| Vérification | Résultat actuel |
| --- | --- |
| `npm run lint` | Terminé sans erreur signalée. |
| `npx prisma validate` | Schéma `prisma/schema.prisma` valide. La configuration indique que le chargement de l’environnement est géré par `prisma.config.mjs`; aucune migration n’a été exécutée. |
| Tests existants | Aucun test repéré dans le workspace. |
| `npm run build` | Non exécuté pendant la phase d’audit. |
| Connexion PostgreSQL / SMTP | Non testée; dépend de services et variables d’environnement externes. |

## Décision avant refactorisation

Cette phase a produit l’audit et le plan, sans changement du code applicatif. La prochaine étape est de valider ce plan, puis de commencer par le module tickets en préservant chaque URL actuelle. Les points à arbitrer avant migration sont la protection des pages produit, la variable `AUTH_SECRET` en production, la documentation SMTP et le maintien temporaire de l’ancien chemin de déclaration de panne. Aucune donnée ni migration Prisma n’a été touchée.

## Résultat de la restructuration (2026-10-29)

Après validation du plan, les implémentations ont été regroupées sous `src/backend/` et `src/frontend/`. Les statuts tickets sans dépendance serveur sont sous `src/shared/`. Les pages et Route Handlers spéciaux restent sous `app/`; les routes API historiques délèguent aux handlers backend, et des réexports sont gardés sous les chemins `lib/` utilisés auparavant.

- Modules backend livrés : `auth`, `db`, `notifications`, `dashboard`, `tickets`, `users`, `products`, `equipment-requests`, `fault-reports`.
- Modules frontend livrés : composants communs et fonctionnalités `tickets`, `users`, `products`, `equipment-requests`, `fault-reports`.
- Les pages produit et demandes qui lisaient Prisma directement utilisent désormais des queries backend. Les pages produit liste/édition vérifient le rôle admin côté serveur.
- Routes de build toujours présentes : `/api/login`, `/api/logout`, `/api/users`, tous les endpoints `/backend/api/...`, `/backend/GestionProduit/...` et les pages `/products_frontend/...` observées dans la phase 1.
- `prisma/schema.prisma` et `prisma/migrations/` n’ont pas été modifiés; aucune migration ni opération de base n’a été exécutée.
- Vérifications finales : `npm run lint` réussi; `npx prisma validate` réussi; `npm run build` réussi et route map conservée. Aucun test automatisé n’est présent. PostgreSQL et SMTP n’ont pas été testés en exécution.

Les guides à jour sont `ARCHITECTURE_PROJET.md`, `ROUTES_API.md`, `GUIDE_INTEGRATION.md` et `DEPENDANCES_MODULES.md`. Le risque de secret `AUTH_SECRET` de repli et les suppressions métier historiques restent signalés; ils n’ont pas été changés par cette migration d’architecture.