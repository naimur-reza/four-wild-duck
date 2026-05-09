import { calculateMonthlySummary } from "@/features/ledger/calculate-ledger";
import type { CashPayment, Expense, Member } from "@/types/ledger";

export const demoMembers: Member[] = [
  { id: "naimur", name: "Naimur", phone: "017xxxxxxxx", status: "active", openingBalance: 3000 },
  { id: "rahim", name: "Rahim", status: "active", openingBalance: 0 },
  { id: "karim", name: "Karim", status: "active", openingBalance: 1000 },
  { id: "hasan", name: "Hasan", status: "active", openingBalance: 0 }
];

export const demoExpenses: Expense[] = [
  { id: "e1", memberId: "rahim", category: "rent", amount: 4800, date: "2026-05-01", note: "House rent" },
  { id: "e2", memberId: "naimur", category: "bazar", amount: 2000, date: "2026-05-04", note: "Bazar" },
  { id: "e3", memberId: "rahim", category: "bazar", amount: 5000, date: "2026-05-10", note: "Weekly bazar" },
  { id: "e4", memberId: "hasan", category: "electricity", amount: 900, date: "2026-05-18", note: "Electricity bill" },
  { id: "e5", memberId: "hasan", category: "internet", amount: 1000, date: "2026-05-20", note: "Internet" }
];

export const demoCashPayments: CashPayment[] = [
  { id: "p1", memberId: "naimur", amount: 4000, date: "2026-05-05", note: "Extra due payment" },
  { id: "p2", memberId: "karim", amount: 3000, date: "2026-05-07", note: "Cash payment" },
  { id: "p3", memberId: "hasan", amount: 4000, date: "2026-05-08", note: "Cash payment" }
];

export const demoLedger = calculateMonthlySummary({ members: demoMembers, expenses: demoExpenses, cashPayments: demoCashPayments });
