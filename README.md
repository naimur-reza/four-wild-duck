# Mess Khata

A mobile-first shared mess expense tracker for family-style messes where everyone spends freely and the monthly total is split equally.

## Core formula

```txt
Monthly Share = Total Shared Expense / Active Members
Total Contribution = Expenses Paid By Member + Cash Payments
Closing Balance = Previous Balance + Monthly Share - Total Contribution
```

Positive closing balance means due. Negative closing balance means advance.

## Stack

- Next.js App Router
- Neon Auth
- Neon Postgres
- Prisma ORM
- Tailwind CSS
- Vercel

## Environment

Add these locally and in Vercel:

```txt
DATABASE_URL=
DIRECT_URL=
NEON_AUTH_BASE_URL=
NEXT_PUBLIC_NEON_AUTH_URL=
NEON_AUTH_COOKIE_SECRET=
```

Never expose server secrets without the `NEXT_PUBLIC_` prefix.

## Local setup

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

## Build

```bash
pnpm build
```

The production build runs `prisma generate && next build`.
