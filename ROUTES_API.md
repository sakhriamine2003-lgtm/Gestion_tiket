# Routes API

Les chemins ci-dessous sont ceux compilés par Next.js. Les fichiers `route.js` restent sous `app/`; l’implémentation est déléguée à `src/backend/features/`.

| Route | Méthodes | Rôles / authentification | Fichier App Router | Implémentation |
| --- | --- | --- | --- | --- |
| `/api/login` | POST | Public | `app/api/login/route.js` | Alias vers le handler login |
| `/api/logout` | POST | Session courante | `app/api/logout/route.js` | Alias vers le handler logout |
| `/api/users` | POST | Admin | `app/api/users/route.js` | Alias création utilisateur |
| `/backend/api/login` | POST | Public | `app/backend/api/login/route.js` | `src/backend/features/auth/login.handler.js` |
| `/backend/api/logout` | POST | Session courante | `app/backend/api/logout/route.js` | `src/backend/features/auth/logout.handler.js` |
| `/backend/api/users` | POST | Admin | `app/backend/api/users/route.js` | `src/backend/features/users/users.handler.js` |
| `/backend/api/users/[id]` | GET, PATCH, DELETE | Admin; un admin ne peut pas supprimer son propre compte | `app/backend/api/users/[id]/route.js` | `src/backend/features/users/user.handler.js` |
| `/backend/api/users/AfficherUsers` | GET | Admin | `app/backend/api/users/AfficherUsers/route.js` | `src/backend/features/users/user-list.handler.js` |
| `/backend/api/tickets` | GET, POST | Session; création réservée aux rôles `utilisateur` et `admin`; liste admin globale, sinon propriétaire | `app/backend/api/tickets/route.js` | `src/backend/features/tickets/ticket-collection.handler.js` |
| `/backend/api/tickets/[id]` | PATCH, DELETE | Utilisateur propriétaire | `app/backend/api/tickets/[id]/route.js` | `src/backend/features/tickets/ticket-item.handler.js` |
| `/backend/api/tickets/[id]/status` | PATCH | Admin ou utilisateur propriétaire; transitions liées au rôle/statut | `app/backend/api/tickets/[id]/status/route.js` | `src/backend/features/tickets/ticket.service.js` |
| `/backend/api/tickets/[id]/messages` | GET, POST | Admin ou utilisateur propriétaire; écriture bloquée ticket fermé | `app/backend/api/tickets/[id]/messages/route.js` | `src/backend/features/tickets/ticket-messages.handler.js` |
| `/backend/api/tickets/[id]/attachments/[attachmentId]` | GET | Session; propriétaire ou admin | `app/backend/api/tickets/[id]/attachments/[attachmentId]/route.js` | `src/backend/features/tickets/ticket-attachment.handler.js` |
| `/backend/api/equipment` | GET | Session requise | `app/backend/api/equipment/route.js` | `src/backend/features/equipment-requests/equipment.handler.js` |
| `/backend/api/equipment-requests` | GET, POST | Session requise; liste globale pour admin et filtrée sinon. `POST` accepte également le mode historique panne pour les utilisateurs | `app/backend/api/equipment-requests/route.js` | `src/backend/features/equipment-requests/equipment-requests.handler.js` |
| `/backend/api/equipment-requests/[id]` | PATCH | Admin | `app/backend/api/equipment-requests/[id]/route.js` | `src/backend/features/equipment-requests/equipment-request.handler.js` |
| `/backend/api/fault-reports` | GET, POST | Session pour lecture; création réservée à `utilisateur` | `app/backend/api/fault-reports/route.js` | `src/backend/features/fault-reports/fault-reports.handler.js` |
| `/backend/api/fault-reports/[id]` | PATCH, DELETE | PATCH : propriétaire pour édition ou admin pour statut. DELETE : utilisateur propriétaire | `app/backend/api/fault-reports/[id]/route.js` | `src/backend/features/fault-reports/fault-report.handler.js` |
| `/backend/GestionProduit/AjouterProduit` | POST | Admin | `app/backend/GestionProduit/AjouterProduit/route.js` | `src/backend/features/products/product.handler.js` |
| `/backend/GestionProduit/ModifierProduit` | PUT | Admin | `app/backend/GestionProduit/ModifierProduit/route.js` | `src/backend/features/products/product.handler.js` |
| `/backend/GestionProduit/SupprimerProduit` | DELETE | Admin | `app/backend/GestionProduit/SupprimerProduit/route.js` | `src/backend/features/products/product.handler.js` |
| `/backend/GestionProduit` | Aucun handler exporté | Sans méthode prise en charge (réponse 405 attendue) | `app/backend/GestionProduit/route.js` | Fichier historique vide |

Les Route Handlers non mentionnés pour une route ne sont pas implémentés; Next.js répond 405 pour une méthode non prise en charge. La route `/backend/api/equipment` ne propose que GET. Aucun endpoint de lecture des notifications n’est présent : les notifications sont actuellement créées en base lors du changement de statut d’une panne.

## Client HTTP

`src/frontend/services/api.js` utilise `baseURL: "/backend/api"`. Les formulaires produit appellent séparément `/backend/GestionProduit/...`. Les alias `/api/login`, `/api/logout` et `/api/users` sont maintenus pour compatibilité.