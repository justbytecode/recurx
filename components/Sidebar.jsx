'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  X,
  Home,
  Users,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Key,
  BarChart2,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ role }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const merchantNav = [
    { name: 'Dashboard', href: '/dashboard/merchant', icon: Home },
    { name: 'Analytics', href: '/dashboard/merchant/analytics', icon: BarChart2 },
    { name: 'Customers', href: '/dashboard/merchant/customers', icon: Users },
    { name: 'Plans', href: '/dashboard/merchant/plans', icon: DollarSign },
    { name: 'Subscriptions', href: '/dashboard/merchant/subscriptions', icon: DollarSign },
    { name: 'Pay Links', href: '/dashboard/merchant/pay-links', icon: LinkIcon },
    { name: 'Invoices', href: '/dashboard/merchant/invoices', icon: FileText },
    { name: 'Transactions', href: '/dashboard/merchant/transactions', icon: DollarSign },
    { name: 'Wallet', href: '/dashboard/merchant/wallet', icon: Wallet },
    { name: 'Withdrawals', href: '/dashboard/merchant/withdrawals', icon: DollarSign },
    { name: 'API Keys', href: '/dashboard/merchant/api', icon: Key },
    { name: 'KYB', href: '/dashboard/merchant/kyb', icon: Settings },
  ];

  const userNav = [
    { name: 'Dashboard', href: '/dashboard/user', icon: Home },
    { name: 'Subscriptions', href: '/dashboard/user/subscriptions', icon: DollarSign },
    { name: 'Transactions', href: '/dashboard/user/transactions', icon: DollarSign },
    { name: 'Wallet', href: '/dashboard/user/wallet', icon: Wallet },
    { name: 'Support', href: '/dashboard/user/support', icon: HelpCircle },
  ];

  const navItems = role === 'merchant' ? merchantNav : userNav;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-transform duration-200 hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-full sm:w-80 md:w-64 bg-gray-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out max-h-screen flex flex-col border-r border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white">RecurX</h2>
          </div>
          {session && (
            <p className="mt-2 text-sm text-gray-400 truncate">
              {session.user.name} <span className="capitalize">({role})</span>
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scroCryllbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <item.icon
                className={`w-5 h-5 ${
                  pathname === item.href ? 'text-white' : 'text-gray-400'
                }`}
              />
              <span>{item.name}</span>
              {pathname === item.href && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/dashboard/merchant/settings"
            className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 p-3 w-full rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}