# How to Run BookLeaf Portal

## Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

---

## Quick Start (Run Locally)

### 1. Install Dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
```
*(Optional: Set your `OPENAI_API_KEY` in `backend/.env` for live AI classification & draft generation. If left unset, the application runs in manual fallback mode).*

### 3. Setup & Seed Database
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```
*Seeds all 10 authors and 18 books from `bookleaf_sample_data.json`.*

### 4. Start Development Servers
```bash
npm run dev
```

---

## Live & Local URLs
- **Live Demo**: [https://leafdesk.vercel.app](https://leafdesk.vercel.app/)
- **Live API Docs**: [https://leafdesk-api.onrender.com/api/docs](https://leafdesk-api.onrender.com/api/docs)
- **Local Web Portal**: [http://localhost:5173](http://localhost:5173)
- **Local Swagger Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **Local Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## Test Credentials
The login page has 1-click persona quick-login buttons, or you can log in manually:

| Role | Name & Code | Email | Password | Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Admin | `admin@bookleaf.test` | `Admin@123` | Priority queue, AI draft generator, triage overrides, internal notes |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `BookLeaf@123` | Published titles, live sales, royalty earnings, ticket history |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `BookLeaf@123` | Title in production (`BK013`), milestone stepper |
| **Author** | Kavita Deshmukh (`AUTH009`) | `kavita.deshmukh@email.com` | `BookLeaf@123` | Sub-threshold pending royalties (< ₹1,000) rollover notice |
| **Author** | Ananya Reddy (`AUTH003`) | `ananya.reddy@email.com` | `BookLeaf@123` | Zero payout history edge case |

---

## Run Automated Tests
```bash
npm --prefix backend test
```
*(Runs all 16 Vitest integration tests covering RBAC isolation and AI graceful degradation).*
