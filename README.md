# Gocomet RFQ & Auction System

A modern, full-stack web application designed to manage Requests for Quotations (RFQs) and supplier bidding. This system implements an intelligent **British Auction** engine, featuring automatic bid-driven time extensions, rank tracking, and strict deadline enforcements.

## 🚀 Tech Stack

**Frontend:**
*   **React** (Functional Components, Hooks)
*   **Vite** (Lightning-fast build tool)
*   **Vanilla CSS** (Custom premium dark theme UI with glassmorphism)

**Backend:**
*   **Node.js & Express.js** (REST API)
*   **Prisma ORM** (Database interaction and migrations)
*   **PostgreSQL** (Hosted on Supabase)

---

## 🏗️ Project Structure

This project is configured as a monorepo, making it incredibly easy to manage both the frontend and backend from a single terminal.

```text
gocomet/
├── backend/               # Node.js + Express backend
│   ├── prisma/            # Database schema & migrations
│   ├── src/
│   │   ├── config/        # Prisma client setup
│   │   ├── controllers/   # Request/Response handlers
│   │   ├── routes/        # Express API routes
│   │   └── services/      # Core business logic & validations
│   └── app.js             # Express entry point
│
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # RfqList, CreateRfq, RfqDetails
│   │   ├── App.jsx        # State-based router
│   │   └── index.css      # Styling rules
│
└── package.json           # Root configuration for concurrent execution
```

---

## ✨ Core Features

1.  **RFQ Management:** Create detailed RFQs specifying Bid Windows, Service Dates, and Forced Close Times.
2.  **Supplier Bidding:** Suppliers can submit granular quotes (Freight, Origin, Destination charges).
3.  **Strict Validations:**
    *   Total Amount must be strictly greater than 0.
    *   Quote Validity Date must be $\ge$ the Service Date.
    *   Forced Close Time must be $>$ Bid Close Time.
4.  **British Auction Extension Engine:** Automatically extends the auction closing time if specific triggers occur during a defined "Trigger Window".
    *   **ANY_BID:** Extends if any new bid is received.
    *   **ANY_RANK:** Extends if any supplier's rank changes.
    *   **L1_RANK:** Extends only if the lowest bidder (L1) rank changes.
5.  **Dynamic Status:** RFQs automatically transition between `ACTIVE`, `CLOSED`, and `FORCE_CLOSED` based on real-time chronological checks.

---

## 🛠️ Setup & Installation

### 1. Install Dependencies
From the root `gocomet/` directory, run the following command to install dependencies for the root, frontend, and backend simultaneously:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Navigate into the `backend/` directory and create/edit the `.env` file. You need to provide your Supabase PostgreSQL connection strings:
```env
PORT=5000

# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 3. Push Database Schema
Sync your Prisma schema with your Supabase database by running this from the root directory:
```bash
npm run db:push
```

### 4. Start the Application
To run both the Express backend and the React frontend concurrently, simply run:
```bash
npm run dev
```
*   **Frontend UI:** `http://localhost:5173`
*   **Backend API:** `http://localhost:5000`

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rfqs` | Fetch all RFQs and determine their current status. |
| `POST` | `/api/rfqs` | Create a new RFQ (Validates Forced Close Time). |
| `GET` | `/api/rfqs/:id` | Fetch details, bid history, and logs for a specific RFQ. |
| `POST` | `/api/rfqs/:id/bid` | Submit a new quote, evaluate rank changes, and trigger extensions. |
