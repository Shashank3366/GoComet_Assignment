# Gocomet RFQ System - Database Architecture

This document outlines the Entity-Relationship (ER) model for the Gocomet RFQ & Auction System.

## ER Diagram

```mermaid
erDiagram
    RFQ ||--o{ BID : "has many"
    RFQ ||--o{ AUCTION_LOG : "generates"
    SUPPLIER ||--o{ BID : "places"

    RFQ {
        string id PK
        string referenceId UK "e.g. RFQ-9821"
        string name
        datetime startTime
        datetime endTime
        datetime forcedCloseTime
        datetime serviceDate
        int triggerWindowMins
        int extensionDurationMins
        string extensionType "ANY_BID, ANY_RANK, L1_RANK"
        string status "ACTIVE, CLOSED, FORCE_CLOSED"
        datetime createdAt
    }

    SUPPLIER {
        string id PK
        string name
        datetime createdAt
    }

    BID {
        string id PK
        string rfqId FK
        string supplierId FK
        string carrierName
        float freightCharges
        float originCharges
        float destinationCharges
        float totalAmount "Calculated: freight + origin + destination"
        string transitTime
        datetime quoteValidity
        int rank "Dynamic: L1, L2, L3..."
        datetime submittedAt
    }

    AUCTION_LOG {
        string id PK
        string rfqId FK
        string eventType "EXTENSION_TRIGGERED, BID_SUBMITTED..."
        string description
        datetime timestamp
    }
```

## Data Dictionary

### RFQ (Request for Quotation)
- **referenceId**: Unique human-readable identifier.
- **status**:
  - `ACTIVE`: Bidding is open.
  - `CLOSED`: Normal end time reached.
  - `FORCE_CLOSED`: The absolute deadline (forcedCloseTime) reached.
- **extensionType**: The rule used to trigger the British Auction extension engine.

### Bid
- **totalAmount**: Sum of Freight, Origin, and Destination charges.
- **rank**: The competitive position (1 = Lowest/L1). Recalculated on every new bid.

### AuctionLog
- Automatically populated by the backend whenever a significant event occurs (Bid submission, Time extension, etc).
