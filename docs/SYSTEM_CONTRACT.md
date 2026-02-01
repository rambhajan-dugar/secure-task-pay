# KAAM.COM SYSTEM CONTRACT v1.0

## Overview

This document defines the authoritative system invariants, state machines, and responsibilities for the kaam.com escrow-based task marketplace.

---

## 1. TASK STATE MACHINE

```
┌─────────┐
│  open   │──────────────────────┐
└────┬────┘                      │
     │ accept (doer)             │ cancel (poster)
     ▼                           ▼
┌─────────┐                ┌───────────┐
│ accepted│                │ cancelled │
└────┬────┘                └───────────┘
     │ start (doer)
     ▼
┌────────────┐
│ in_progress│
└─────┬──────┘
      │ submit (doer)
      ▼
┌───────────┐
│ submitted │──────────────┬──────────────┐
└─────┬─────┘              │              │
      │ approve (poster)   │ dispute      │ auto-release
      │                    │ (poster)     │ (system, 24h)
      ▼                    ▼              ▼
┌──────────┐         ┌──────────┐   ┌───────────┐
│ approved │         │ disputed │   │ completed │
└────┬─────┘         └────┬─────┘   └───────────┘
     │                    │
     │ release            │ admin resolve
     ▼                    ▼
┌───────────┐        ┌───────────┐
│ completed │        │ completed │
└───────────┘        └───────────┘
```

### State Transition Rules

| From State   | To State     | Actor       | Conditions                          |
|--------------|--------------|-------------|-------------------------------------|
| open         | accepted     | doer        | doer != poster, not frozen          |
| open         | cancelled    | poster      | no doer assigned                    |
| accepted     | in_progress  | doer        | assigned doer only                  |
| in_progress  | submitted    | doer        | assigned doer only                  |
| submitted    | approved     | poster      | poster only                         |
| submitted    | disputed     | poster      | poster only, reason required        |
| submitted    | completed    | system      | auto_release_at passed (24h)        |
| approved     | completed    | system      | automatic after approval            |
| disputed     | completed    | admin       | resolution required                 |

**INVARIANT**: State can only move forward. No backward transitions.

---

## 2. ESCROW LIFECYCLE

```
┌─────────┐       ┌───────────┐       ┌──────────┐
│ pending │──────▶│ in_escrow │──────▶│ released │
└─────────┘       └─────┬─────┘       └──────────┘
                        │
                        ├──────────▶ refunded (dispute → poster wins)
                        │
                        └──────────▶ disputed (locked pending resolution)
```

### Escrow Rules

| Transition    | Trigger                  | Wallet Effect                    |
|---------------|--------------------------|----------------------------------|
| → in_escrow   | Task created             | None (sandbox)                   |
| → released    | Approve / Auto-release   | +net_payout to doer wallet       |
| → refunded    | Dispute → poster wins    | +gross_amount to poster wallet   |
| → disputed    | Task disputed            | Funds locked                     |

**INVARIANT**: Escrow can only be released ONCE. Optimistic locking via `version` column.

---

## 3. WALLET INVARIANTS

1. **Balance Non-Negative**: `wallet_balance >= 0` (enforced by CHECK constraint)
2. **Audit Trail**: Every wallet change creates a `wallet_events` record
3. **Atomic Updates**: Wallet + escrow + task updated in single transaction
4. **Event Types**:
   - `escrow_release` - Payment from completed task
   - `auto_release` - Auto-released after 24h
   - `dispute_resolution` - Admin split payout
   - `dispute_refund` - Poster refund
   - `sandbox_deposit` - Test funds added
   - `sandbox_withdrawal` - Test funds removed
   - `admin_credit` - Manual admin adjustment

---

## 4. ROLE PERMISSIONS

### task_poster
- CREATE tasks
- CANCEL own open tasks
- APPROVE submitted work
- DISPUTE submitted work
- RELEASE escrow manually

### task_doer
- ACCEPT open tasks (not own)
- START accepted tasks
- SUBMIT completed work
- VIEW own wallet/earnings

### admin
- RESOLVE disputes (full_release, full_refund, split)
- FORCE task state changes
- FREEZE/UNFREEZE users
- CREDIT/DEBIT wallets
- VIEW all audit logs

### system
- AUTO-RELEASE after 24h timeout
- RETRY failed jobs
- CLEANUP expired data

---

## 5. SECURITY BOUNDARIES

### Frontend (UNTRUSTED)
- ❌ Cannot write directly to any table
- ❌ Cannot bypass RLS
- ❌ Cannot access other users' data
- ✅ Reads via authenticated Supabase client
- ✅ Mutations only via /v1 edge functions

### Edge Functions (TRUSTED)
- ✅ All state mutations
- ✅ Fee calculations
- ✅ Idempotency enforcement
- ✅ Rate limiting
- ✅ Audit logging

### Database (ENFORCED)
- ✅ RLS on all tables
- ✅ CHECK constraints on amounts
- ✅ Foreign key integrity
- ✅ Optimistic locking on escrow

---

## 6. IDEMPOTENCY RULES

**Required for**:
- Task accept
- Task submit  
- Task approve
- Task dispute
- Escrow release
- Wallet add-funds
- Wallet withdraw

**Behavior**:
- Same key + same request hash → Return cached response
- Same key + different request hash → 409 DUPLICATE_REQUEST
- Keys expire after 24 hours

---

## 7. RATE LIMITS

| Operation       | Limit          | Window |
|-----------------|----------------|--------|
| Task create     | 10             | 1 hour |
| Task accept     | 5              | 1 hour |
| Wallet add      | 10             | 1 hour |
| Wallet withdraw | 5              | 1 hour |

**Enforcement**: `rate_limits` table, checked at function entry.

---

## 8. BACKGROUND JOBS

### Auto-Release Job
- **Schedule**: Every 10 minutes via pg_cron
- **Logic**: Find submitted tasks where `auto_release_at < now()`
- **Idempotent**: Checks escrow status before release
- **Retry**: Failed releases go to `failed_jobs`

### Failed Jobs
- **Max Retries**: 5
- **Backoff**: Exponential (2^attempts minutes)
- **Alert**: After 3 failures, flag for admin review

---

## 9. ERROR CODES

| Code              | HTTP | Meaning                              |
|-------------------|------|--------------------------------------|
| UNAUTHORIZED      | 401  | Missing or invalid auth token        |
| USER_FROZEN       | 403  | Account is frozen                    |
| NOT_FOUND         | 404  | Resource doesn't exist               |
| RATE_LIMITED      | 429  | Too many requests                    |
| INVALID_STATE     | 400  | Invalid state transition             |
| DUPLICATE_REQUEST | 409  | Idempotency key reused               |
| VALIDATION_ERROR  | 400  | Invalid input                        |
| INTERNAL_ERROR    | 500  | Server error                         |

---

## 10. PLATFORM FEE

- **Rate**: 12.5% (fixed)
- **Calculation**: Server-side only
- **Formula**: 
  - `platform_fee = round(reward_amount * 0.125)`
  - `net_payout = reward_amount - platform_fee`

---

## 11. DATA OWNERSHIP

| Table                 | Owner Access                        |
|-----------------------|-------------------------------------|
| tasks                 | poster (full), doer (assigned only) |
| escrow_transactions   | poster + doer (own tasks only)      |
| submissions           | doer (create), poster (read)        |
| wallet_events         | user (own only)                     |
| task_events           | participants + admin                |
| disputes              | participants + admin                |
| user_freezes          | admin (write), user (read own)      |

---

## 12. VERSION HISTORY

| Version | Date       | Changes                    |
|---------|------------|----------------------------|
| 1.0     | 2026-01-30 | Initial production release |

---

**END OF CONTRACT**
