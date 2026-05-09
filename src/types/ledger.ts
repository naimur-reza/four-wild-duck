export type MemberStatus = "active" | "inactive";

export type Member = {
  id: string;
  name: string;
  phone?: string;
  status: MemberStatus;
  openingBalance: number;
};

export type ExpenseCategory = "rent" | "bazar" | "electricity" | "gas" | "internet" | "other";

export type Expense = {
  id: string;
  memberId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
};

export type CashPayment = {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  note?: string;
};

export type MemberMonthlySummary = {
  member: Member;
  previousBalance: number;
  monthlyShare: number;
  expensePaid: number;
  cashPaid: number;
  totalContribution: number;
  closingBalance: number;
};
