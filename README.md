# Gestion des tickets et du matériel

Application web JavaScript/JSX construite avec Next.js App Router, React, Prisma et PostgreSQL. Les pages et les routes API sont dans `app/`. Le contrôle des sessions est dans `lib/auth.js`.

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

Les rôles sont définis dans `lib/auth.js`. Les pages protègent l’accès avec `requireRole(...)` et les routes API vérifient aussi la session et le rôle.

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

Les tickets suivent le workflow `Ouvert → En cours → Traité → Fermé` (valeurs en base : `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, définies dans `lib/ticket-status.js`). L’administrateur passe un ticket à « En cours » puis « Traité » ; l’utilisateur propriétaire peut ensuite le fermer. Chaque changement envoie un e-mail (SMTP) : à l’utilisateur pour « En cours » et « Traité », à l’administrateur pour « Fermé » (adresse `ADMIN_EMAIL`, sinon comptes administrateurs). Un ticket fermé n’accepte plus de messages mais reste consultable. Les permissions et transitions sont contrôlées côté serveur dans `app/backend/api/tickets/[id]/status/route.js`.

Les tickets sont distincts des déclarations de pannes. Un utilisateur crée un ticket depuis « Mes tickets » avec un titre, un message et, facultativement, jusqu’à quatre photos ou vidéos (25 Mo au total). Les photos sont limitées à 5 Mo chacune et les vidéos à 20 Mo chacune. Les utilisateurs ne voient que leurs tickets ; les administrateurs voient tous les tickets dans la section « Tickets ».

La migration `prisma/migrations/20261006153500_add_user_tickets_and_attachments/migration.sql` ajoute la relation utilisateur et le stockage des pièces jointes. Les fichiers ne sont accessibles qu’à l’utilisateur propriétaire et aux administrateurs.

## Fichiers backend

- `app/backend/api/equipment/route.js` : liste les produits ; en mode panne, renvoie uniquement les produits associés à une demande acceptée par l’utilisateur connecté.
- `app/backend/api/equipment-requests/route.js` : crée des demandes d’équipement et renvoie les demandes de l’utilisateur, ou toutes les demandes à l’admin. Ce fichier conserve aussi la compatibilité avec l’ancien formulaire de panne.
- `app/backend/api/equipment-requests/[id]/route.js` : permet à l’admin d’accepter ou de refuser une demande et met à jour le stock lors d’une acceptation.
- `app/backend/api/fault-reports/route.js` : liste les déclarations (toutes pour l’admin, personnelles pour l’utilisateur) et en crée après vérification du matériel accepté.
- `app/backend/api/fault-reports/[id]/route.js` : réserve à l’admin la modification du statut d’une panne.
- `app/backend/api/tickets/route.js` : crée les tickets utilisateur et renvoie les tickets selon le rôle.
- `app/backend/api/tickets/[id]/attachments/[attachmentId]/route.js` : sert une pièce jointe après contrôle des droits.
- `app/backend/GestionProduit/AjouterProduit/route.js` : crée un produit après vérification de la session et du rôle administrateur.
- `prisma/schema.prisma` : modèles, champs et relations Prisma, dont `Product` et `FaultReport`.
- `prisma/migrations/20260930120000_add_fault_reports/migration.sql` : crée la table des déclarations et limite ses statuts en base.
- `lib/prisma.js` : instance Prisma partagée par les routes et pages serveur.
- `lib/axios.js` : instance Axios utilisée par les panneaux client.

## Fichiers frontend

- `app/components/AppNavigation.jsx` : liens de navigation adaptés au rôle.
- `app/products_frontend/Gestion_product/AjouterProduit/page.jsx` : formulaire de création d’un produit pour la gestion du stock.
- `app/products_frontend/Gestion_role/admin/demandes-equipement/page.jsx` et `EquipmentRequestsPanel.jsx` : page admin et interface de traitement des demandes.
- `app/products_frontend/Gestion_role/admin/declarations-pannes/page.jsx` et `FaultReportsPanel.jsx` : page admin et tableau des déclarations avec changement de statut.
- `app/products_frontend/Gestion_role/admin/tickets/page.jsx` et `AdminTicketsPanel.jsx` : page admin des tickets utilisateur.
- `app/products_frontend/Gestion_role/utilisateur/declarations-pannes/page.jsx` et `FaultReportPanel.jsx` : formulaire de panne et historique personnel.
- `app/products_frontend/Gestion_role/utilisateur/tickets/page.jsx` et `UserTicketsPanel.jsx` : création et historique des tickets personnels.
- `app/products_frontend/Gestion_role/utilisateur/page.jsx` et `EquipmentRequestPanel.jsx` : tableau de bord et demandes d’équipement de l’utilisateur.

## Notifications e-mail

Le flux de demandes d’équipement et l’ancien formulaire de panne envoient des e-mails à l’utilisateur et aux administrateurs. La page dédiée « Mes déclarations de pannes » n’envoie pas d’e-mail.

Pour activer l’envoi, configurer Resend dans `.env` :

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Gestion tickets <notifications@votre-domaine.com>
```

`EMAIL_FROM` doit utiliser un domaine vérifié dans Resend. Sans ces variables, les demandes continuent de fonctionner et l’absence de configuration est inscrite dans les logs.