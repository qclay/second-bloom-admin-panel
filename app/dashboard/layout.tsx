'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { useLocaleStore, LOCALES, type AdminLocale } from '@/lib/locale-store';
import { useTranslations, type TranslationKey } from '@/lib/translations';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLocaleChange = (newLocale: AdminLocale) => {
    setLocale(newLocale);
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      const id = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const navigation = [
    { nameKey: 'nav.dashboard', href: '/dashboard', icon: '📊' },
    { nameKey: 'nav.categories', href: '/dashboard/categories', icon: '📁' },
    { nameKey: 'nav.conditions', href: '/dashboard/conditions', icon: '📋' },
    { nameKey: 'nav.sizes', href: '/dashboard/sizes', icon: '📐' },
    { nameKey: 'nav.products', href: '/dashboard/products', icon: '📦' },
    { nameKey: 'nav.orders', href: '/dashboard/orders', icon: '🛒' },
    { nameKey: 'nav.users', href: '/dashboard/users', icon: '👥' },
    { nameKey: 'nav.reports', href: '/dashboard/reports', icon: '🚨' },
    { nameKey: 'nav.reviews', href: '/dashboard/reviews', icon: '⭐' },
    { nameKey: 'nav.chat', href: '/dashboard/chat', icon: '💬' },
    { nameKey: 'nav.publicationPricing', href: '/dashboard/publication-pricing', icon: '💰' },
    { nameKey: 'nav.settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  const sidebar = (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between lg:justify-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-xl">🌸</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Second Bloom</h1>
            <p className="text-xs text-gray-500">{t('common.adminPanel')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label={t('common.closeMenu')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.nameKey}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{t(item.nameKey as TranslationKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('common.language')}</label>
          <select
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value as AdminLocale)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {LOCALES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
            {user?.firstName?.[0] || user?.phoneNumber?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.firstName || user?.phoneNumber || 'Admin'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={() => { closeSidebar(); handleLogout(); }}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
        >
          {t('common.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label={t('common.openMenu')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-lg">🌸</span>
          </div>
          <span className="font-bold text-gray-900">Second Bloom</span>
        </div>
        <div className="w-10" />
      </header>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/50"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      <aside
        className={`
          w-64 bg-white border-r border-gray-200 flex flex-col shrink-0
          fixed lg:static inset-y-0 left-0 z-[70] lg:z-auto
          top-0 lg:top-auto
          transform transition-transform duration-200 ease-out
          lg:shadow-[2px_0_8px_rgba(0,0,0,0.04)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 sm:gap-4 px-4 py-3 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 sm:sr-only" htmlFor="global-locale">{t('common.language')}</label>
            <select
              id="global-locale"
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as AdminLocale)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            >
              {LOCALES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0" title={user?.firstName || user?.phoneNumber || 'Admin'}>
              {user?.firstName?.[0] || user?.phoneNumber?.[0] || 'A'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName || user?.phoneNumber || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { closeSidebar(); handleLogout(); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('common.logout')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
