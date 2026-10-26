# BookLeaf Author Support & Communication Portal

> Full-stack author support portal, operations queue, and AI-assisted triage system built for BookLeaf Publishing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-black.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 1. Project Overview

BookLeaf Publishing processes 1,200+ titles monthly across a 22,000+ catalog. Authors reach out regarding royalties, book stages, ISBN issues, and print quality. This solution eliminates support backlogs through:

1. **Author Portal**:
   - **My Books**: Clean portfolio view displaying live sales, royalties earned/paid/pending, and an interactive stage progression stepper for in-production titles (handling pre-publication nulls cleanly without errors).
   - **Smart Rollover Detection**: Automatically highlights pending royalties below the ₹1,000 quarterly payout threshold that roll over per Knowledge Base policy.
   - **New Ticket**: Context-scoped query submission (scoped to specific author titles or general account inquiries) with file attachment preview.
   - **Ticket Communication Thread**: Author-facing conversation view with 10-second polling for near real-time updates and follow-up messaging.
2. **Operations Admin Portal**:
   - **Triage Queue**: Ranked server-side by priority descending (`CRITICAL` → `HIGH` → `MEDIUM` → `LOW` → `UNSET`) and age ascending (oldest unresolved urgent issues surface first).
   - **Author Context Panel**: Real figures (pending payout, copies sold, print partner, publication status) injected directly alongside queries.
   - **AI-Assisted Draft Panel**: Generates empathetic, policy-accurate responses (≤150 words) incorporating real data, explicit SLAs, and relevant KB sections.
   - **Strict Data Isolation**: Author-visible replies and confidential admin internal notes are stored in separate database tables.
3. **Resilient AI Pipeline**:
   - **Single-Call Classification & Priority**: Uses OpenAI Structured Outputs (`json_schema` strict mode).
   - **Selective KB Injection**: Injects only 1–2 relevant policy sections instead of full-KB context dumps.
   - **Auditable Cost Tracking**: Every AI invocation logs tokens and calculated cost to `AILog` and console.
   - **Graceful Fallback**: Fully functional when `OPENAI_API_KEY` is unset or rate-limited; displays manual mode badges and allows complete manual operation.

---

## 2. Setup & Run Locally

### Prerequisites
- Node.js `v18.0.0` or higher (tested on Node v20/v24)
- npm `v9+` or `v11+`

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repo-url>
cd booklead-code

# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Step 2: Environment Configuration
Copy the sample environment file in `backend`:
```bash
cp backend/.env.example backend/.env
```

`backend/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=super-secret-bookleaf-jwt-key-2026-development-only
JWT_EXPIRES_IN=7d

# Optional: Add your OpenAI API key for live AI generation.
# If left empty, the application runs seamlessly in manual mode with typed fallbacks.
OPENAI_API_KEY=
```

### Step 3: Run Database Migrations & Seed
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```
*The seed script verifies row count assertions (`10 authors` and `18 books`) and validates null preservation on `BK013` and `BK015`.*

### Step 4: Start Development Servers
From the root directory:
```bash
# Runs both Express backend (port 3001) and Vite frontend (port 5173) concurrently
npm run dev
```
- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Interactive Swagger Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 3. Test Credentials

The database is pre-seeded with all 10 authors and 1 admin from `bookleaf_sample_data.json`:

| Role | Name / Code | Email | Password | Notable Test Scenario |
|---|---|---|---|---|
| **ADMIN** | BookLeaf Operations | `admin@bookleaf.test` | `Admin@123` | Support queue, triage overrides, AI draft, internal notes |
| **AUTHOR** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `BookLeaf@123` | Published titles, pending payout ₹3,570 |
| **AUTHOR** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | `BookLeaf@123` | Multi-title sales, ₹7,744 pending payout |
| **AUTHOR** | Ananya Reddy (`AUTH003`) | `ananya.reddy@email.com` | `BookLeaf@123` | First-time author, zero payouts received yet |
| **AUTHOR** | Sneha Kulkarni (`AUTH007`)| `sneha.kulkarni@email.com` | `BookLeaf@123` | **BK013** In Production ("In Production - Cover Design", nulls preserved) |
| **AUTHOR** | Kavita Deshmukh (`AUTH009`)| `kavita.deshmukh@email.com` | `BookLeaf@123` | **BK015** In Production + **BK016** (₹850 pending rollover below ₹1,000 threshold) |

> **Evaluator Tip**: The top navigation bar in the frontend includes a **"Switch Demo User"** dropdown menu for 1-click account switching without manual login typing.

---

## 4. Architecture Decisions & Why

```text
booklead-code/
├── backend/
│   ├── src/
│   │   ├── ai/            # Provider interface, OpenAI structured output, modular KB, prompts, fallback
│   │   ├── controllers/   # Thin HTTP controllers (validate, call service, respond)
│   │   ├── services/      # Business logic (ticketService, bookService, royaltyService, aiService)
│   │   ├── middleware/    # JWT auth, RBAC requireRole, Zod validation, central errorHandler
│   │   ├── db/            # Prisma client singleton
│   │   └── utils/         # Safe platform parser, AppError
│   └── tests/             # Vitest integration tests (RBAC 403 checks, AI degradation)
└── frontend/
    ├── src/
    │   ├── api/           # Typed REST client with Bearer auth token attachment
    │   ├── context/       # AuthContext for session management
    │   ├── components/    # Reusable UI cards, badges, steppers, and layouts
    │   └── pages/         # Author & Admin views
```

### 1. Separate Tables for `Reply` vs `InternalNote`
- **Decision**: Avoided an `is_internal: boolean` flag on a shared messages table. Implemented separate `Reply` and `InternalNote` models.
- **Why**: Eliminates data leak risks where a query bug or missing `WHERE is_internal = false` filter exposes confidential operational notes to authors. Author endpoints cannot access the `InternalNote` model under any code path.

### 2. Standardized `Authorization: Bearer <token>`
- **Decision**: Sent JWT via HTTP header instead of httpOnly cookies.
- **Why**: Simplifies testing through Swagger UI (`/api/docs`), eliminates cross-origin cookie complications between Vite (port 5173) and Express (port 3001), and provides cleaner stateless horizontal scaling.

### 3. Server-Side Default Queue Sorting
- **Decision**: Implemented priority weighting (`CRITICAL: 5` → `UNSET: 1`) combined with oldest age (`created_at: asc`) in the service layer.
- **Why**: Ensures operational urgency requirements are met without requiring manual frontend table clicks.

### 4. 10-Second Near Real-Time Polling
- **Decision**: Utilized TanStack Query polling (`refetchInterval: 10000`) with a visible timestamp indicator.
- **Why**: Follows the explicit assignment constraint ("Do NOT use WebSockets — ship instead"). Polling provides reliable cross-browser near real-time updates without connection drops, heartbeats, or proxy termination issues.

---

## 5. AI Integration & Cost Awareness

### Prompt Strategy & Tone Calibration
- **Tone Guidelines**: Authors are treated as creative partners, not support tickets. The prompt strictly forbids corporate platitudes (`"We apologize for the inconvenience"`, `"We understand your frustration"`).
- **Context Injection**: Incorporates verified author figures (book title, copies sold, pending royalties, publication stage) and explicit SLAs:
  - Escalations & investigation: **"within 48 hours"**
  - Amazon/Flipkart stock re-sync: **"24–48 hours"**
  - Quality issue reprints: **"5–7 business days"**
- **Word Cap**: Strict **≤150 words** to keep drafts concise and actionable.
- **Follow-up Context**: When a ticket contains prior correspondence, the draft generator automatically includes the last 2 replies in the prompt context so the AI responds coherently to ongoing threads.

### Selective Knowledge Base Injection (`selectKbSections`)
Instead of dumping the entire BookLeaf Knowledge Base on every call, `selectKbSections(category)` selectively injects only the 1–2 relevant policy sections:
- `ROYALTY_AND_PAYMENTS` → 80/20 net profit split, quarterly cycle, 45-day window, ₹1,000 threshold.
- `ISBN_AND_METADATA_ISSUES` → BookLeaf imprint rules, 48-hour team escalation.
- `PRINTING_AND_QUALITY` → 5–7 day turnaround, free defect reprint on photo submission.
- `DISTRIBUTION_AND_AVAILABILITY` → Channel availability, 24–48 hour stock re-sync.
- `BOOK_STATUS_AND_PRODUCTION_UPDATES` → 8-stage production pipeline, approval bottlenecks.

### Cost Awareness & Token Economics
- **Model Choice**: `gpt-4o-mini` is selected for both classification and response drafting.
- **Why not a larger model?**: `gpt-4o-mini` costs **$0.150 per 1M input tokens** and **$0.600 per 1M output tokens**—roughly 16x cheaper than `gpt-4o` ($2.50 / $10.00). Ticket triage and 150-word drafting do not require deep reasoning; strict JSON schemas and focused KB injection deliver high accuracy at minimal cost.
- **Estimated Cost per 1,000 Tickets**:
  - Classification: ~350 prompt tokens + 40 completion tokens = ~$0.000076 per ticket
  - Drafting: ~450 prompt tokens + 120 completion tokens = ~$0.000139 per ticket
  - Total per ticket: **~$0.000215**
  - **Cost per 1,000 tickets**: **~$0.21 (₹18 INR)**
- **Audit Logging**: Every AI call records prompt/completion tokens and status to the `AILog` table and outputs a real-time console metric:
  ```text
  [AI] op=CLASSIFY model=gpt-4o-mini tokens=342/48 cost=$0.000080 category="Royalty & Payments" priority="High"
  ```

### Sample Query AI Quality Evaluation Script
To verify draft tone and accuracy against the 6 sample scenarios from the assignment specification:
```bash
npm run eval:ai
```
*This script runs all 6 queries from pages 6–7 of the PDF, confirms zero corporate fluff ("We apologize for the inconvenience"), checks the 150-word cap, and displays the drafted responses.*

---

## 6. API Documentation

Interactive Swagger OpenAPI 3.1 documentation is served locally at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

### Endpoint Summary

| Category | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **System** | `GET` | `/api/health` | Public | Service health & OpenAI configuration status |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate & issue JWT token |
| | `GET` | `/api/auth/me` | Authenticated | Retrieve logged-in user profile |
| **Author** | `GET` | `/api/author/books` | Author | Scoped list of author's books |
| | `GET` | `/api/author/royalties` | Author | Author's cumulative royalties & rollover status |
| | `GET` | `/api/author/tickets` | Author | Author's tickets (supports `?status=`) |
| | `POST` | `/api/author/tickets` | Author | Open ticket (triggers async AI classification) |
| | `GET` | `/api/author/tickets/:id`| Author | Ticket details & reply thread (ownership enforced) |
| | `POST` | `/api/author/tickets/:id/replies` | Author | Post follow-up reply (409 if closed/resolved) |
| **Admin** | `GET` | `/api/admin/tickets` | Admin | Filtered queue sorted by priority desc, age asc |
| | `GET` | `/api/admin/tickets/:id` | Admin | Full ticket view (author context, notes, AI logs) |
| | `PATCH`| `/api/admin/tickets/:id` | Admin | Update status/priority/category/assignee |
| | `POST` | `/api/admin/tickets/:id/replies` | Admin | Send author-visible reply (OPEN → IN_PROGRESS) |
| | `POST` | `/api/admin/tickets/:id/notes` | Admin | Add confidential internal note |
| | `POST` | `/api/admin/tickets/:id/classify` | Admin | Re-run AI classification on-demand |
| | `POST` | `/api/admin/tickets/:id/draft` | Admin | Generate/regenerate KB-informed draft response |

---

## 7. Automated Test Suite

Run the full integration test suite with Vitest:
```bash
npm test
```

### Verified Test Cases (16/16 Passed):
1. **RBAC & Ownership Security (`rbac-ownership.test.ts`)**:
   - `expect(res.status).toBe(403)` when Author B attempts to access Author A's ticket.
   - `expect(res.status).toBe(403)` when Author B attempts to post a reply on Author A's ticket.
   - `expect(res.status).toBe(401)` when request lacks Authorization Bearer token.
   - `expect(res.status).toBe(404)` for nonexistent ticket ID.
   - `expect(res.status).toBe(403)` when Author attempts to access Admin queue `/api/admin/tickets`.
   - `expect(res.status).toBe(200)` when Admin accesses Author A's ticket.
   - `expect(res.status).toBe(409)` when Author attempts to reply to a closed/resolved ticket.
2. **AI Graceful Degradation (`ai-degradation.test.ts`)**:
   - Verifies ticket creation persists with `UNCLASSIFIED` / `UNSET` / `SKIPPED` when `OPENAI_API_KEY` is empty.
   - Verifies on-demand classification and drafting return typed fallbacks without 500 errors.
   - Verifies manual category/priority overrides set `is_overridden = true`.
   - Verifies admin replies are author-visible while internal notes remain strictly invisible to authors.

---

## 8. Deployment Notes & Production Readiness

When deploying to Render, Railway, or Fly.io:
1. Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `NODE_ENV=production`).
2. Run database migration and seed once at build/release:
   ```bash
   npx prisma migrate deploy && npx prisma db seed
   ```
3. The application will immediately boot with all 10 authors, 18 books, and admin user pre-loaded.
