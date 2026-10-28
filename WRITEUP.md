# Technical Write-Up: Engineering Approach & Production Evolution

**Author:** Tushar Singhal (Full-Stack Developer Candidate)  
**Project:** BookLeaf Author Support & Communication Portal  

---

## 1. Core Priorities

In approaching this assignment, effort was distributed in strict alignment with the evaluation criteria: **AI Integration (25%)** and **Architecture & Code Quality (25%)** first, followed by **API Design (15%)** and **Functionality (15%)**, with **UI Polish** kept clean and functional.

1. **Production-Grade AI Pipeline, Not Demo Magic**:
   - Rather than sending unstructured text to an LLM, we implemented OpenAI Structured Outputs (`response_format: json_schema, strict: true`) to guarantee valid JSON adhering to our Prisma enums.
   - We engineered a selective Knowledge Base loader (`selectKbSections`) that identifies the ticket domain (Royalties, ISBN, Printing, Distribution, Production) and injects only the 1–2 relevant policy sections. This eliminates token bloat and keeps drafts tightly focused.
   - We enforced strict anti-fluff instructions (forbidding corporate phrases like *"We apologize for the inconvenience"*) and injected real author figures (exact pending royalty amounts, sold copy counts) alongside explicit SLAs (*"within 48 hours"*, *"24–48 hours"*, *"5–7 business days"*).
2. **Fail-Safe Graceful Degradation**:
   - AI is an enhancement, not a single point of failure. If `OPENAI_API_KEY` is omitted, times out (10s limit), or encounters a 429 rate limit, ticket creation remains non-blocking. The ticket row is safely tagged with `category=UNCLASSIFIED`, `priority=UNSET`, and `ai_status=SKIPPED/FAILED`. The admin dashboard displays an *"AI unavailable — manual mode"* badge, enabling full manual triage and response.
3. **Rock-Solid RBAC & Data Isolation**:
   - Instead of an `is_internal` flag on a shared table, we separated `Reply` and `InternalNote` models at the database level. An author endpoint cannot query internal notes under any code path.
   - Multi-layer authorization ensures that author ownership is validated in middleware and within service-layer queries. We backed this with automated integration tests verifying that Author B receives a `403 Forbidden` when attempting to access Author A's ticket or post replies.

---

## 2. Key Architectural Trade-Offs

| Decision | Chosen Approach | Alternative Considered | Rationale |
|---|---|---|---|
| **Real-Time Communication** | 10s Polling with React Query & visible timestamp | WebSockets / Socket.io | Followed explicit spec instructions ("Do NOT use WebSockets — ship instead"). Polling provides deterministic cross-browser updates without connection drops, sticky sessions, or reverse proxy termination overhead. |
| **Knowledge Base Retrieval** | Deterministic category-based section injection | Vector Database RAG (Pinecone/pgvector) | The BookLeaf Knowledge Base is a concise 6-topic operational manual. Vector search adds embedding latency, retrieval stochasticity, and infrastructure overhead for zero measurable gain over deterministic rule mapping. |
| **Model Selection** | `gpt-4o-mini` | `gpt-4o` or Claude 3.5 Sonnet | `gpt-4o-mini` is ~16x cheaper ($0.21 per 1,000 tickets) and offers sub-second latency with strict schema enforcement. For narrow classification and 150-word policy drafts, larger frontier models provide no perceptible accuracy advantage. |
| **Authentication Transport** | `Authorization: Bearer <token>` header | `httpOnly` secure cookies | Simplifies automated testing, eliminates cross-origin port issues during local development (port 5173 to 3001), and provides seamless testing via Swagger UI. |

---

## 3. How to Evolve This into an Enterprise Production System

Given additional time and enterprise scaling requirements, here is how this architecture would evolve:

1. **Asynchronous Background Processing with Redis & BullMQ**:
   - While classification is currently handled non-blockingly, high-volume spikes (e.g., quarterly royalty releases) should offload AI classification, SLA tracking, and email notifications to a dedicated Redis queue.
2. **Production Database & Multi-Tenant Partitioning**:
   - Transition Prisma to PostgreSQL with read replicas (`DATABASE_URL` is already structured as a drop-in replacement).
   - Partition author data and book records by imprint or geographic region (India vs. US catalog) with composite indexing on `(author_id, created_at)`.
3. **Direct S3 / Cloudflare R2 Pre-Signed Uploads**:
   - Expand the current file attachment UI into direct-to-object-storage pre-signed URL uploads, passing verified image URLs directly into OpenAI's vision model to automatically verify misprints and binding defects.
4. **Third-Party Logistics & Marketplace Integrations**:
   - Webhook listeners for Amazon SP-API and Repro India's ERP to automatically trigger the 24–48 hour stock re-sync and print tracking directly from the admin detail panel.
