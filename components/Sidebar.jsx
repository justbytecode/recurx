// components/Sidebar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, DollarSign, Users, Settings, Wallet, Link as LinkIcon, FileText, CreditCard, Users2, Repeat, Menu, X } from 'lucide-react';

const userLinks = [
  { name: 'Dashboard', href: '/dashboard/user', icon: Home },
  { name: 'Pay Links', href: '/dashboard/user/pay-links', icon: LinkIcon },
  { name: 'Subscriptions', href: '/dashboard/user/subscriptions', icon: DollarSign },
  { name: 'Transactions', href: '/dashboard/user/transactions', icon: DollarSign },
  { name: 'Wallet', href: '/dashboard/user/wallet', icon: Wallet },
  { name: 'Settings', href: '/dashboard/user/settings', icon: Settings },
];

const merchantLinks = [
  { name: 'Dashboard', href: '/dashboard/merchant', icon: Home },
  { name: 'Customers', href: '/dashboard/merchant/customers', icon: Users2 },
  { name: 'Invoices', href: '/dashboard/merchant/invoices', icon: FileText },
  { name: 'Pay Links', href: '/dashboard/merchant/pay-links', icon: LinkIcon },
  { name: 'Plans', href: '/dashboard/merchant/plans', icon: CreditCard },
  { name: 'Subscriptions', href: '/dashboard/merchant/subscriptions', icon: Repeat },
  { name: 'Transactions', href: '/dashboard/merchant/transactions', icon: DollarSign },
  { name: 'Wallet', href: '/dashboard/merchant/wallet', icon: Wallet },
  { name: 'Settings', href: '/dashboard/merchant/settings', icon: Settings },
];

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const links = role === 'merchant' ? merchantLinks : userLinks;
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gray-900 text-white shadow-lg flex flex-col p-4 z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-64'}
          rounded-r-2xl
        `}
      >
        <div className="flex items-center justify-center h-16 mb-6">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png" // Replace with your logo path
              alt="Payment Platform Logo"
              className="w-10 h-10 rounded-full"
            />
            <h1 className="text-xl font-bold">Payment Platform</h1>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium
                ${pathname === link.href ? 'bg-gray-800 text-emerald-500' : 'hover:bg-gray-700'}
              `}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}