import { BarChart3, Clock3, CreditCard, Home, ReceiptText, Settings, UsersRound } from "lucide-react";

export const dashboardNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Members", href: "/members", icon: UsersRound },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "History", href: "/history", icon: Clock3 },
  { label: "Settings", href: "/settings", icon: Settings }
];
