# Gestion des tickets et du matériel

Application web construite avec Next.js App Router, React, Prisma et PostgreSQL. Les pages et les routes API sont dans `app/`. Le contrôle des sessions est dans `lib/auth.ts`.

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

Commandes de vérification :

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
```

## Rôles

- `utilisateur` : envoie des demandes d’équipement, déclare une panne sur son matériel accepté et consulte ses propres déclarations.
- `admin` : traite les demandes, consulte toutes les déclarations et modifie leur statut.
- `responsable` : rôle reconnu par les sessions ; les pages spécifiques dépendent de l’application.

Les rôles sont définis dans `lib/auth.ts`. Les pages protègent l’accès avec `requireRole(...)` et les routes API vérifient aussi la session et le rôle.

## Parcours matériel et pannes

1. L’utilisateur envoie une demande depuis son tableau de bord.
2. L’admin accepte ou refuse la demande dans « Demandes d’équipement ».
3. Seuls les équipements ayant une demande `Acceptée` pour l’utilisateur connecté sont proposés dans « Mes déclarations de pannes ».
4. L’API vérifie à nouveau cette acceptation lors de l’enregistrement : masquer un équipement dans l’interface ne suffit pas à protéger la route.
5. Le statut de panne est partagé entre l’admin et l’utilisateur. Les valeurs en base sont `a_faire`, `en_cours` et `termine` ; l’interface les affiche comme « À faire », « En cours » et « Terminé ».

## Tickets utilisateur

Les tickets sont distincts des déclarations de pannes. Un utilisateur crée un ticket depuis « Mes tickets » avec un titre, un message et, facultativement, jusqu’à quatre photos ou vidéos (25 Mo au total). Les photos sont limitées à 5 Mo chacune et les vidéos à 20 Mo chacune. Les utilisateurs ne voient que leurs tickets ; les administrateurs voient tous les tickets dans la section « Tickets ».

La migration `prisma/migrations/20261006153500_add_user_tickets_and_attachments/migration.sql` ajoute la relation utilisateur et le stockage des pièces jointes. Les fichiers ne sont accessibles qu’à l’utilisateur propriétaire et aux administrateurs.

## Fichiers backend

- `app/backend/api/equipment/route.ts` : liste les produits ; en mode panne, renvoie uniquement les produits associés à une demande acceptée par l’utilisateur connecté.
- `app/backend/api/equipment-requests/route.ts` : crée des demandes d’équipement et renvoie les demandes de l’utilisateur, ou toutes les demandes à l’admin. Ce fichier conserve aussi la compatibilité avec l’ancien formulaire de panne.
- `app/backend/api/equipment-requests/[id]/route.ts` : permet à l’admin d’accepter ou de refuser une demande et met à jour le stock lors d’une acceptation.
- `app/backend/api/fault-reports/route.ts` : liste les déclarations (toutes pour l’admin, personnelles pour l’utilisateur) et en crée après vérification du matériel accepté.
- `app/backend/api/fault-reports/[id]/route.ts` : réserve à l’admin la modification du statut d’une panne.
- `app/backend/api/tickets/route.ts` : crée les tickets utilisateur et renvoie les tickets selon le rôle.
- `app/backend/api/tickets/[id]/attachments/[attachmentId]/route.ts` : sert une pièce jointe après contrôle des droits.
- `prisma/schema.prisma` : modèles, champs et relations Prisma, dont `FaultReport`.
- `prisma/migrations/20260930120000_add_fault_reports/migration.sql` : crée la table des déclarations et limite ses statuts en base.
- `lib/prisma.ts` : instance Prisma partagée par les routes et pages serveur.
- `lib/axios.ts` : instance Axios utilisée par les panneaux client.

## Fichiers frontend

- `app/components/AppNavigation.tsx` : liens de navigation adaptés au rôle.
- `app/products_frontend/Gestion_role/admin/demandes-equipement/page.tsx` et `EquipmentRequestsPanel.tsx` : page admin et interface de traitement des demandes.
- `app/products_frontend/Gestion_role/admin/declarations-pannes/page.tsx` et `FaultReportsPanel.tsx` : page admin et tableau des déclarations avec changement de statut.
- `app/products_frontend/Gestion_role/admin/tickets/page.tsx` et `AdminTicketsPanel.tsx` : page admin des tickets utilisateur.
- `app/products_frontend/Gestion_role/utilisateur/declarations-pannes/page.tsx` et `FaultReportPanel.tsx` : formulaire de panne et historique personnel.
- `app/products_frontend/Gestion_role/utilisateur/tickets/page.tsx` et `UserTicketsPanel.tsx` : création et historique des tickets personnels.
- `app/products_frontend/Gestion_role/utilisateur/page.tsx` et `EquipmentRequestPanel.tsx` : tableau de bord et demandes d’équipement de l’utilisateur.

## Notifications e-mail

Le flux de demandes d’équipement et l’ancien formulaire de panne envoient des e-mails à l’utilisateur et aux administrateurs. La page dédiée « Mes déclarations de pannes » n’envoie pas d’e-mail.

Pour activer l’envoi, configurer Resend dans `.env` :

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Gestion tickets <notifications@votre-domaine.com>
```

`EMAIL_FROM` doit utiliser un domaine vérifié dans Resend. Sans ces variables, les demandes continuent de fonctionner et l’absence de configuration est inscrite dans les logs.