import { BarChart3, ChefHat, Clock3, CreditCard, Grid2X2, ReceiptText, Settings, UsersRound } from "lucide-react";

export const dashboardNavItems = [
  { label: "Home", href: "/dashboard", icon: Grid2X2 },
  { label: "Members", href: "/members", icon: UsersRound },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Cooking", href: "/cooking", icon: ChefHat },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "History", href: "/history", icon: Clock3 },
  { label: "Settings", href: "/settings", icon: Settings }
];
