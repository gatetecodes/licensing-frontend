# BNR Licensing Frontend

Frontend application for the **Bank Licensing & Compliance Portal**.

This UI is deployed at: `https://bnr-licensing.usecarelogic.com` and works with the deployed backend API at:
`https://bnr-licensing-core.usecarelogic.com`

It supports applicant onboarding, draft-to-decision application lifecycle, document versioning, internal review/approval workflows, admin user management, and audit trail visibility.

## System Overview

- Frontend: `React 19` + `TypeScript` + `Vite` + `TanStack Router` + `TanStack Query` + `Ant Design`
- Backend: `Node.js` + `Express` + `Sequelize` + `PostgreSQL` + `Redis`
- Auth model: server-side sessions (`bnr.sid` cookie) + CSRF token header (`x-csrf-token`)
- API base path consumed by frontend: `/api/v1`

## What This UI Covers

### Applicant

- Public registration
- Email verification
- Login/logout
- Create and edit application drafts
- Submit completed applications
- Respond to structured information requests
- Upload and replace documents (PDF, max 5 MB)
- View application details and state progression

### Reviewer

- View non-draft queue
- Start review (`SUBMITTED`/`RESUBMITTED` -> `UNDER_REVIEW`)
- Request structured additional information (`UNDER_REVIEW` -> `INFO_REQUESTED`)
- Mark ready for final decision (`UNDER_REVIEW` -> `READY_FOR_DECISION`)

### Approver

- View decision-ready applications
- Approve or reject (`READY_FOR_DECISION` -> `APPROVED`/`REJECTED`)

### Admin

- Invite internal users (`REVIEWER`, `APPROVER`, `ADMIN`)
- Enable/disable internal users
- View internal user list with filters

### Internal Visibility

- Review queue for internal users
- Document versions and downloads
- Application audit timeline

## Workflow States

`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> (`INFO_REQUESTED` -> `RESUBMITTED` -> `UNDER_REVIEW`) -> `READY_FOR_DECISION` -> `APPROVED`/`REJECTED`

Enforced by backend service and DB constraints; frontend only mirrors allowed actions.

## Local Run Guide (Frontend + Backend)

## 1) Prerequisites

- Node.js: `>=20.19.0 <21 || >=22.12.0`
- PostgreSQL running locally
- Redis running locally

## 2) Backend setup (required first)

Clone repository and:

```bash
npm ci
npm run build
npm run db:migrate:up
npm run db:seed
npm run dev
```

Default backend port: `4009`

Health check:

- `GET {{BACKEND_URL}}/api/v1/health`

API docs:

- `{{BACKEND_URL}}/api-docs/v1`

## 3) Frontend Local setup

From this repo:

```bash
npm ci
npm run dev
```

## 4) Frontend Local environment

This repo expects:

```env
VITE_API_BASE_URL=http://localhost:4009/api/v1
VITE_API_TIMEOUT_MS=15000
VITE_APP_NAME=BNR Licensing Portal
```

## Seed Data and Credentials

Source of truth for seed values: backend `.env` + `src/database/seed.ts`.

## Seeded password

- `Passw0rd!123`

## Seeded users (current local config)

- Applicant 1: `josephine.kankwa@gamail.com`
- Applicant 2: `bertran.mukasa@gamail.com`
- Applicant 3: `emmanuel.kalisa@gamail.com`
- Reviewer 1: `augustine.ntwari@gamail.com`
- Reviewer 2: `evariste.muyamba@agmail.com`
- Approver 1: `pauline.mukisa@ggmail.com`
- Approver 2: `gabriel.munyagwa@gamail.com`
- Admin: `auwimana@gamail.com`

All seeded users use the same seeded password above unless backend seed env values are changed.

## Seeded applications (current implementation behavior)

- `BNR-SEED-SUBMITTED-0001`
- `BNR-SEED-READY-0001`

Both are currently seeded into `DRAFT` state by the active seed script.

This is intentional for draft-first walkthroughs.

## How to Use the System End-to-End

## Applicant flow

1. Open `/register` and create an applicant account.
2. Verify email using `/verify-email?token=...` link.
3. Login at `/login`.
4. Go to `/applications`.
5. Create draft, complete profile/contact/licensing details.
6. Upload required document types:
   - `BUSINESS_PLAN`
   - `CERTIFICATE_OF_INCORPORATION`
   - `SHAREHOLDING_STRUCTURE`
   - `CAPITAL_ADEQUACY_EVIDENCE`
   - `GOVERNANCE_DOCUMENT`
7. Submit application.
8. If status becomes `INFO_REQUESTED`, respond and resubmit.

## Reviewer flow

1. Login as reviewer.
2. Open `/review-queue`.
3. Start review on `SUBMITTED` or `RESUBMITTED` applications.
4. Either request structured information, or mark ready for decision.
5. Inspect documents and details from queue drawer.

## Approver flow

1. Login as approver.
2. Open `/review-queue`.
3. On `READY_FOR_DECISION` items, approve or reject with reason.

## Admin flow

1. Login as admin.
2. Open `/admin/users`.
3. Invite internal users.
4. Enable/disable internal users.

## Documents and audit

- Documents page: `/documents`
- Audit page: `/audit-log`

Both rely on application visibility rules enforced by backend.

## API Contract Notes

- Session cookie: `bnr.sid`
- CSRF header for mutating requests: `x-csrf-token`
- Success envelope shape:
  - `status`
  - `message`
  - `data`
  - `timestamp`

## Implementation Notes (Current)

- Applicant onboarding now writes immutable user-audit events in backend `user_audit_logs` for:
  - `APPLICANT_REGISTERED`
  - `APPLICANT_EMAIL_VERIFIED`
- Internal password-setup links are generated from backend `app.resetPasswordUri`.
- Local backend default for password setup now points to frontend `/set-password`.
- Review queue UI hides decision action when the logged-in approver is the recorded reviewer on that application.

## Scripts (frontend)

- `npm run dev` - start development server
- `npm run build` - type-check and build
- `npm run lint` - lint source
- `npm run preview` - preview production build

## Governing Design Document

An implementation-aligned governing design document is maintained in this repo's root, and at:

[Bank Licensing Compliance Portal Design Document](https://www.notion.so/gatetecodes/Bank-Licensing-Compliance-Portal-Design-Document-35db343696f480518e85cf8ac59e5557?source=copy_link)
