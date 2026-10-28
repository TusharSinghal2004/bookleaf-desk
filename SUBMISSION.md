# How to Run the Project

## Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

---

## Quick Start (Run Locally)

### 1. Install Dependencies
From the project root:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment
Create the backend `.env` file:
```bash
cp backend/.env.example backend/.env
```
*(Optional: Add your `OPENAI_API_KEY` in `backend/.env` for live AI generation. If left blank, the app runs smoothly in manual fallback mode).*

### 3. Setup & Seed Database
Run migrations and populate the database with the provided 10 authors and 18 books:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Start the Application
From the root directory:
```bash
npm run dev
```

---

## Access URLs
- **Web Portal (Author & Admin)**: [http://localhost:5173](http://localhost:5173)
- **Backend Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Interactive Swagger API Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## Demo Login Credentials
The login page includes 1-click persona buttons, or you can log in manually:

| Role | Name & Code | Email | Password | Notable Test Case |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Admin | `admin@bookleaf.test` | `Admin@123` | Priority queue, AI draft generator, triage overrides, internal notes |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `BookLeaf@123` | Published books, live royalties, ticket history |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `BookLeaf@123` | Book in production (`BK013`), milestone stepper |
| **Author** | Kavita Deshmukh (`AUTH009`) | `kavita.deshmukh@email.com` | `BookLeaf@123` | Sub-threshold pending royalties (< ₹1,000) rollover notice |
| **Author** | Ananya Reddy (`AUTH003`) | `ananya.reddy@email.com` | `BookLeaf@123` | Zero payout history edge case |

---

## Run Automated Tests
To run the automated integration test suite (16 test cases):
```bash
npm --prefix backend test
```
