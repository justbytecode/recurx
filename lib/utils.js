import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const merchantNavItems = [
  { name: "Dashboard", href: "/dashboard/merchant" },
  { name: "Analytics", href: "/dashboard/merchant/analytics" },
  { name: "Pay Links", href: "/dashboard/merchant/pay-links" },
  { name: "Customers", href: "/dashboard/merchant/customers" },
  { name: "Transactions", href: "/dashboard/merchant/transactions" },
  { name: "Team", href: "/dashboard/merchant/team" },
  { name: "API", href: "/dashboard/merchant/api" },
  { name: "Settlements", href: "/dashboard/merchant/settlements" },
  { name: "Invoices", href: "/dashboard/merchant/invoices" },
  { name: "Subscriptions", href: "/dashboard/merchant/subscriptions" },
  { name: "Withdrawals", href: "/dashboard/merchant/withdrawals" },
  { name: "Wallet", href: "/dashboard/merchant/wallet" },
  { name: "Plans", href: "/dashboard/merchant/plans" },
  { name: "Settings", href: "/dashboard/merchant/settings" },
  { name: "KYB", href: "/dashboard/merchant/kyb" },
];

export const userNavItems = [
  { name: "Dashboard", href: "/dashboard/user" },
  { name: "Transactions", href: "/dashboard/user/transactions" },
  { name: "Subscriptions", href: "/dashboard/user/subscriptions" },
  { name: "Wallet", href: "/dashboard/user/wallet" },
  { name: "Support", href: "/dashboard/user/support" },
];

export const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};