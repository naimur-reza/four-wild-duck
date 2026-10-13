export function formatTaka(amount: number) {
  const value = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0
  }).format(amount);

  return `Tk ${value}`;
}

export function currentMonthLabel(date = new Date()) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function nextMonthLabel(date = new Date()) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return currentMonthLabel(next);
}
