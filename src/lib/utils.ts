export function formatTaka(amount: number) {
  const value = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0
  }).format(amount);

  return `৳${value}`;
}
