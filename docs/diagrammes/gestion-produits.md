# Diagrammes UML — application de gestion

Ces diagrammes Mermaid s'affichent dans l'aperçu Markdown de VS Code et sur GitHub. Le diagramme de classes représente les modèles actuels de la base de données. Les sources PlantUML sont également disponibles dans le même dossier.

## Diagramme de classes

```mermaid
classDiagram
    class User {
        +Int id
        +String name
        +String email
        +String password
        +String user_role
        +Int equipmentCount
        +DateTime createdAt
        +DateTime lastSeenAt?
    }

    class Product {
        +Int id
        +String marque
        +String bureau
        +Float prix
        +Int stock
        +Int initialStock
        +DateTime createdAt
        +DateTime updatedAt
    }

    class EquipmentRequest {
        +Int id
        +String status
        +String reason?
        +DateTime createdAt
        +Int userId
        +Int productId
    }

    class FaultReport {
        +Int id
        +String description
        +String status
        +DateTime createdAt
        +DateTime updatedAt
        +Int userId
        +Int productId
    }

    class Notification {
        +Int id
        +Int userId
        +String message
        +DateTime createdAt
    }

    class Ticket {
        +Int id
        +String title
        +String description
        +String status
        +DateTime createdAt
        +DateTime updatedAt
        +Int userId?
        +DateTime adminReadAt?
        +DateTime userReadAt?
    }

    class TicketMessage {
        +Int id
        +Int ticketId
        +Int senderId?
        +String senderRole
        +String content
        +DateTime createdAt
    }

    class TicketAttachment {
        +Int id
        +Int ticketId
        +Int messageId?
        +String fileName
        +String contentType
        +Int size
        +Bytes data
        +DateTime createdAt
    }

    User "1" --> "0..*" EquipmentRequest : effectue
    Product "1" --> "0..*" EquipmentRequest : concerne
    User "1" --> "0..*" FaultReport : signale
    Product "1" --> "0..*" FaultReport : concerne
    User "1" --> "0..*" Notification : reçoit
    User "0..1" --> "0..*" Ticket : ouvre
    Ticket "1" *-- "0..*" TicketMessage : contient
    User "0..1" --> "0..*" TicketMessage : envoie
    Ticket "1" *-- "0..*" TicketAttachment : pièces jointes
    TicketMessage "0..1" --> "0..*" TicketAttachment : pièce jointe au message
```

## Diagramme de cas d'utilisation

```mermaid
flowchart LR
    Admin[Administrateur]
    Utilisateur[Utilisateur]

    subgraph Gestion["Gestion des produits et du matériel"]
        Catalogue([Consulter le catalogue])
        Ajouter([Ajouter un produit])
        Modifier([Modifier un produit])
        Supprimer([Supprimer un produit])
        Saisir([Saisir marque, bureau, prix et stock])
        Valider([Valider les données])
        Demande([Demander un équipement])
        Panne([Déclarer une panne sur un matériel accepté])
    end

    Admin --> Catalogue
    Admin --> Ajouter
    Admin --> Modifier
    Admin --> Supprimer
    Ajouter -. include .-> Saisir
    Ajouter -. include .-> Valider
    Modifier -. include .-> Saisir
    Modifier -. include .-> Valider
    Utilisateur --> Demande
    Utilisateur --> Panne
```

Le diagramme comprend les huit modèles actuels du schéma Prisma : `User`, `Product`, `EquipmentRequest`, `FaultReport`, `Notification`, `Ticket`, `TicketMessage` et `TicketAttachment`. Les demandes d'équipement sont liées au modèle `Product`. La création d'un produit est réservée à un administrateur authentifié. À la création, le stock initial est également enregistré dans `initialStock`. Une déclaration de panne concerne un matériel pour lequel la demande de l'utilisateur a été acceptée.
