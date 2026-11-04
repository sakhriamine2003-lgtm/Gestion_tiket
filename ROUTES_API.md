# Routes API

Les chemins ci-dessous sont ceux compilés par Next.js. Les fichiers `route.js` restent sous `app/`; l’implémentation est déléguée à `src/backend/features/`.

| Route | Méthodes | Rôles / authentification | Fichier App Router | Implémentation |
| --- | --- | --- | --- | --- |
| `/api/connexion` | POST | Public | `app/api/connexion/route.js` | Alias vers le handler login |
| `/api/deconnexion` | POST | Session courante | `app/api/deconnexion/route.js` | Alias vers le handler logout |
| `/api/utilisateurs` | POST | Admin | `app/api/utilisateurs/route.js` | Alias création utilisateur |
| `/backend/api/connexion` | POST | Public | `app/backend/api/connexion/route.js` | `src/backend/features/authentification/connexion.handler.js` |
| `/backend/api/deconnexion` | POST | Session courante | `app/backend/api/deconnexion/route.js` | `src/backend/features/authentification/deconnexion.handler.js` |
| `/backend/api/utilisateurs` | POST | Admin | `app/backend/api/utilisateurs/route.js` | `src/backend/features/utilisateurs/utilisateurs.handler.js` |
| `/backend/api/utilisateurs/[id]` | GET, PATCH, DELETE | Admin; un admin ne peut pas supprimer son propre compte | `app/backend/api/utilisateurs/[id]/route.js` | `src/backend/features/utilisateurs/utilisateur.handler.js` |
| `/backend/api/utilisateurs/AfficherUtilisateurs` | GET | Admin | `app/backend/api/utilisateurs/AfficherUtilisateurs/route.js` | `src/backend/features/utilisateurs/listeUtilisateurs.handler.js` |
| `/backend/api/tickets` | GET, POST | Session; création réservée aux rôles `utilisateur` et `admin`; liste admin globale, sinon propriétaire | `app/backend/api/tickets/route.js` | `src/backend/features/tickets/collectionTickets.handler.js` |
| `/backend/api/tickets/[id]` | PATCH, DELETE | Utilisateur propriétaire | `app/backend/api/tickets/[id]/route.js` | `src/backend/features/tickets/elementTicket.handler.js` |
| `/backend/api/tickets/[id]/statut` | PATCH | Admin ou utilisateur propriétaire; transitions liées au rôle/statut | `app/backend/api/tickets/[id]/statut/route.js` | `src/backend/features/tickets/serviceTicket.js` |
| `/backend/api/tickets/[id]/messages` | GET, POST | Admin ou utilisateur propriétaire; écriture bloquée ticket fermé | `app/backend/api/tickets/[id]/messages/route.js` | `src/backend/features/tickets/messagesTicket.handler.js` |
| `/backend/api/tickets/[id]/pieces-jointes/[attachmentId]` | GET | Session; propriétaire ou admin | `app/backend/api/tickets/[id]/pieces-jointes/[attachmentId]/route.js` | `src/backend/features/tickets/pieceJointeTicket.handler.js` |
| `/backend/api/equipement` | GET | Session requise | `app/backend/api/equipement/route.js` | `src/backend/features/demandes-equipement/equipement.handler.js` |
| `/backend/api/demandes-equipement` | GET, POST | Session requise; liste globale pour admin et filtrée sinon. `POST` accepte également le mode historique panne pour les utilisateurs | `app/backend/api/demandes-equipement/route.js` | `src/backend/features/demandes-equipement/demandesEquipement.handler.js` |
| `/backend/api/demandes-equipement/[id]` | PATCH | Admin | `app/backend/api/demandes-equipement/[id]/route.js` | `src/backend/features/demandes-equipement/traiterDemandeEquipement.handler.js` |
| `/backend/api/declarations-pannes` | GET, POST | Session pour lecture; création réservée à `utilisateur` | `app/backend/api/declarations-pannes/route.js` | `src/backend/features/declarations-pannes/declarationsPannes.handler.js` |
| `/backend/api/declarations-pannes/[id]` | PATCH, DELETE | PATCH : propriétaire pour édition ou admin pour statut. DELETE : utilisateur propriétaire | `app/backend/api/declarations-pannes/[id]/route.js` | `src/backend/features/declarations-pannes/declarationPanne.handler.js` |
| `/backend/GestionProduit/AjouterProduit` | POST | Admin | `app/backend/GestionProduit/AjouterProduit/route.js` | `src/backend/features/produits/produit.handler.js` |
| `/backend/GestionProduit/ModifierProduit` | PUT | Admin | `app/backend/GestionProduit/ModifierProduit/route.js` | `src/backend/features/produits/produit.handler.js` |
| `/backend/GestionProduit/SupprimerProduit` | DELETE | Admin | `app/backend/GestionProduit/SupprimerProduit/route.js` | `src/backend/features/produits/produit.handler.js` |
| `/backend/GestionProduit` | Aucun handler exporté | Sans méthode prise en charge (réponse 405 attendue) | `app/backend/GestionProduit/route.js` | Fichier historique vide |

Les Route Handlers non mentionnés pour une route ne sont pas implémentés; Next.js répond 405 pour une méthode non prise en charge. La route `/backend/api/equipement` ne propose que GET. Aucun endpoint de lecture des notifications n’est présent : les notifications sont actuellement créées en base lors du changement de statut d’une panne.

## Client HTTP

`src/frontend/services/api.js` utilise `baseURL: "/backend/api"`. Les formulaires produit appellent séparément `/backend/GestionProduit/...`. Les alias `/api/connexion`, `/api/deconnexion` et `/api/utilisateurs` sont maintenus pour compatibilité.