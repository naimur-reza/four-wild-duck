import type { CashPayment, Expense, Member, MemberMonthlySummary } from "@/types/ledger";

export function calculateMonthlySummary({
  members,
  expenses,
  cashPayments,
  previousBalances
}: {
  members: Member[];
  expenses: Expense[];
  cashPayments: CashPayment[];
  previousBalances?: Record<string, number>;
}) {
  const activeMembers = members.filter((member) => member.status === "active");
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyShare = activeMembers.length > 0 ? totalExpense / activeMembers.length : 0;

  const summaries: MemberMonthlySummary[] = activeMembers.map((member) => {
    const expensePaid = expenses
      .filter((expense) => expense.memberId === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const cashPaid = cashPayments
      .filter((payment) => payment.memberId === member.id)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const previousBalance = previousBalances?.[member.id] ?? member.openingBalance;
    const totalContribution = expensePaid + cashPaid;
    const closingBalance = previousBalance + monthlyShare - totalContribution;

    return { member, previousBalance, monthlyShare, expensePaid, cashPaid, totalContribution, closingBalance };
  });

  return { totalExpense, memberCount: activeMembers.length, monthlyShare, summaries };
}
