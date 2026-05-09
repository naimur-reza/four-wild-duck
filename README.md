# Mess Khata

A mobile-first shared mess expense tracker for family-style messes where everyone spends freely and the monthly total is split equally.

## Core formula

```txt
Closing Balance = Previous Balance + Monthly Share - Total Contribution
Monthly Share = Total Shared Expense / Active Members
Total Contribution = Expenses Paid By Member + Cash Payments
```

Positive balance means due. Negative balance means advance.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth-ready structure

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Database

Run the SQL inside `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.
