# Notes and Assumptions

This document outlines key technical assumptions, product decisions, and operational notes made during the development of the **BookLeaf Author Support & Communication Portal**.

For the detailed 1-page engineering approach, architectural trade-offs, and enterprise production roadmap, please see **[WRITEUP.md](WRITEUP.md)**.

---

## 1. AI Integration & Token Optimization
- **Selective Knowledge Base Injection (`selectKbSections`)**: Instead of dumping the entire 6-topic Knowledge Base on every LLM call, the backend selectively retrieves only the 1–2 relevant policy sections based on the ticket domain (e.g., only Royalty Policy for payment inquiries). This eliminates prompt bloat, keeps drafts focused, and significantly reduces token consumption.
- **Structured Outputs (`json_schema` strict mode)**: Classification and priority scoring utilize OpenAI's structured outputs with strict JSON schema enforcement to guarantee type-safe adherence to our Prisma enums (`TicketCategory`, `TicketPriority`), eliminating parsing failures or hallucinated categories.
- **Fail-Safe Graceful Degradation**: The system treats AI as an accelerator rather than a single point of failure. If `OPENAI_API_KEY` is omitted, times out (10s limit), or hits a 429 rate limit, ticket creation remains non-blocking. Tickets are safely tagged as `MANUAL_TRIAGE` with priority `UNSET`, and the admin portal displays an *"AI unavailable — manual mode"* badge, allowing complete manual operation.

---

## 2. Security & Data Isolation
- **Physical Separation of Notes & Replies**: Confidential admin internal notes are stored in a dedicated `InternalNote` table, completely separated from author-visible `Reply` records. Author endpoints have no code path or join to access internal notes.
- **Role-Based Access Control (RBAC)**: Enforced through JWT authentication middleware and database-level ownership filters. Authors can only query and mutate their own books and tickets (`where: { author_id }`). This is verified through 16 automated integration tests.
- **API Key Security**: The `OPENAI_API_KEY` is stored strictly in server-side environment variables and is never bundled or exposed to client-side code.

---

## 3. Real-Time Communication Strategy
- **10-Second Polling via React Query**: In accordance with the assignment guidance to favor practical, robust shipping over WebSockets, the portal uses 10-second background polling with visible sync timestamps. This provides deterministic live updates across all browsers without connection dropouts, sticky session requirements, or reverse proxy termination complexity.

---

## 4. Sample Dataset & Edge Case Handling
- **Seed Assertions**: The database seed script (`prisma/seed.ts`) loads `bookleaf_sample_data.json` and asserts exact counts: 10 authors and 18 books.
- **Edge Cases Handled Gracefully**:
  - **In-Production Titles (`BK013`, `BK015`)**: Null publication dates, null MRP, and zero royalty figures are preserved in the database and rendered cleanly via a milestone stepper without NaN or formatting crashes.
  - **Quarterly Rollover (`AUTH009` / `BK016`)**: Pending royalties below the ₹1,000 threshold are automatically flagged with a Knowledge Base rollover notice.
  - **Zero Payout History (`AUTH003` / `BK005`)**: Handled with neutral empty states rather than missing data errors.

---

## 5. Knowledge Base Integration in Author Views
- To reduce incoming ticket volume, the Knowledge Base policies (80/20 royalty split, 5–7 day free reprint guarantee, 48-hour ISBN resolution SLA, 24–48 hour stock re-sync) are exposed directly to authors on the New Ticket form (dynamic keyword matching), Book Detail view, and My Tickets dashboard.
