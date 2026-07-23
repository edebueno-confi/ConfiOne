# B2B HubSpot Relationship Read Model Implementation Plan

> **For agentic workers:** Execute the steps in order and preserve the existing worktree. This plan is read-only with respect to remote systems.

**Goal:** Expose the existing HubSpot relationship contract in the B2B customer cockpit without fabricating company, group, or deal associations.

**Architecture:** The Supabase RPC `rpc_analytics_customer_relationship_contract(integer, integer)` remains the backend source of truth. The frontend adds a typed read adapter and a pure normalizer, then renders a compact global data-context strip; customer-specific associations remain unavailable until an explicit mapping contract exists.

**Tech Stack:** React, TypeScript, Supabase browser client, Node test runner, existing GeniusOS minimal UI primitives.

---

### Task 1: Define the contract normalizer with a failing test

**Files:**
- Create: `apps/web/src/features/customers/customer-relationship-model.ts`
- Test: `tests/scripts/customer-relationship-model.test.mjs`

- [ ] Write tests for valid totals, unavailable source, malformed arrays, and pagination metadata.
- [ ] Run `node --test tests/scripts/customer-relationship-model.test.mjs` and verify it fails because the normalizer does not exist.
- [ ] Implement only the types and pure `mapCustomerRelationshipSnapshot` function required by the tests.
- [ ] Re-run the focused test and the full Node suite.

### Task 2: Add the Supabase read adapter

**Files:**
- Create: `apps/web/src/features/customers/customer-relationship-api.ts`

- [ ] Call the existing RPC with bounded `p_limit` and `p_offset` values.
- [ ] Convert Supabase errors through the existing application error helper.
- [ ] Keep the adapter read-only and do not infer tenant/company associations.
- [ ] Run contracts and web typecheck.

### Task 3: Render the source context in Clientes B2B

**Files:**
- Modify: `apps/web/src/features/customers/CustomersPage.tsx`

- [ ] Load the relationship snapshot independently from customer and segment data.
- [ ] Render compact totals with explicit source/provenance and unavailable/error state.
- [ ] Do not add a permanent third column or duplicate customer KPIs.
- [ ] Keep the drawer free of unassociated HubSpot records.

### Task 4: Document and verify

**Files:**
- Modify: `docs/plan.md`
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`

- [ ] Run focused test, full Node tests, contracts typecheck, web typecheck, web build, repository hygiene and diff check.
- [ ] Run authenticated browser smoke on `/support/clientes` and capture the compact source context.
- [ ] Record the explicit limitation that per-customer linking remains a separate backend contract.

