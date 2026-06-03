'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { useLocaleStore, LOCALES, type AdminLocale } from '@/lib/locale-store';
import { useTranslations, type TranslationKey } from '@/lib/translations';
import {
  LayoutDashboard,
  Folder,
  ClipboardList,
  Ruler,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  DollarSign,
  Settings,
  Sparkles,
  Menu,
  X,
  CreditCard,
  FileText,
} from 'lucide-react';

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

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { nameKey: 'nav.dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Store Management',
      items: [
        { nameKey: 'nav.orders', href: '/dashboard/orders', icon: <ShoppingCart className="w-5 h-5" /> },
        { nameKey: 'nav.products', href: '/dashboard/products', icon: <Package className="w-5 h-5" /> },
        { nameKey: 'nav.categories', href: '/dashboard/categories', icon: <Folder className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Catalog Attributes',
      items: [
        { nameKey: 'nav.conditions', href: '/dashboard/conditions', icon: <ClipboardList className="w-5 h-5" /> },
        { nameKey: 'nav.sizes', href: '/dashboard/sizes', icon: <Ruler className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Community & Moderation',
      items: [
        { nameKey: 'nav.users', href: '/dashboard/users', icon: <Users className="w-5 h-5" /> },
        { nameKey: 'nav.reports', href: '/dashboard/reports', icon: <AlertTriangle className="w-5 h-5" /> },
      ]
    },
    {
      title: 'System & Settings',
      items: [
        { nameKey: 'nav.payments', href: '/dashboard/payments', icon: <CreditCard className="w-5 h-5" /> },
        { nameKey: 'nav.publications', href: '/dashboard/publications', icon: <FileText className="w-5 h-5" /> },
        { nameKey: 'nav.publicationPricing', href: '/dashboard/publication-pricing', icon: <DollarSign className="w-5 h-5" /> },
        { nameKey: 'nav.settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const sidebar = (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between lg:justify-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Second Bloom</h1>
            <p className="text-xs text-gray-500">{t('common.adminPanel')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label={t('common.closeMenu')}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title} className="mb-6 last:mb-0">
              <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.nameKey}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 font-bold border-r-4 border-purple-500 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-purple-600 font-medium'
                      }`}
                      style={{ animationDelay: `${(groupIndex * 3 + itemIndex) * 0.05}s` }}
                    >
                      <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                      <span className="text-sm tracking-tight">{t(item.nameKey as TranslationKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={t('common.openMenu')}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
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
          w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col shrink-0
          fixed lg:static inset-y-0 left-0 z-[70] lg:z-auto
          top-0 lg:top-auto
          transform transition-transform duration-300 ease-in-out
          lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 sm:gap-4 px-4 py-3 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-md border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:sr-only" htmlFor="global-locale">{t('common.language')}</label>
            <select
              id="global-locale"
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as AdminLocale)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-full bg-white/50 text-slate-700 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all cursor-pointer hover:bg-white"
            >
              {LOCALES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="min-w-0 hidden sm:block text-right">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tighter">{user?.firstName || user?.phoneNumber || 'Admin'}</p>
              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{user?.role || 'ADMIN'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-sm ai-glow">
              {(user?.firstName?.[0] || 'A').toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { closeSidebar(); handleLogout(); }}
            className="px-4 py-1.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all shadow-md active:scale-95 uppercase tracking-widest"
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
