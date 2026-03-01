'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from '@/lib/translations';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { analyticsService } from '@/services/analytics.service';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function toStringValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && ('en' in value || 'uz' in value || 'ru' in value)) {
    const o = value as Record<string, unknown>;
    const s = o.en ?? o.uz ?? o.ru;
    return typeof s === 'string' ? s : '';
  }
  return String(value);
}

function getDateRange(preset: string): { dateFrom: string; dateTo: string } | null {
  const to = new Date();
  const toStr = to.toISOString().slice(0, 10);
  if (preset === '7d') {
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr };
  }
  if (preset === '30d') {
    const from = new Date(to);
    from.setDate(from.getDate() - 29);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr };
  }
  return null;
}

export default function DashboardPage() {
  const t = useTranslations();
  const [datePreset, setDatePreset] = useState<string>('');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const analyticsParams = useMemo(() => {
    if (datePreset === 'custom' && customFrom && customTo) return { dateFrom: customFrom, dateTo: customTo };
    return getDateRange(datePreset) ?? undefined;
  }, [datePreset, customFrom, customTo]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll({}),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({}),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAll({}),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll({}),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-dashboard', analyticsParams?.dateFrom, analyticsParams?.dateTo],
    queryFn: () => analyticsService.getDashboard(analyticsParams),
  });

  const totalProducts = productsData?.data.length || 0;
  const totalOrders = ordersData?.data.length || 0;
  const totalUsers = usersData?.data.length || 0;
  const totalCategories = categoriesData?.data.length || 0;
  const totalRevenue = ordersData?.data.reduce((sum, order) => sum + order.totalPrice, 0) || 0;
  const pendingOrders = ordersData?.data.filter(o => o.status === 'PENDING').length || 0;

  const orderStatusData = [
    { name: t('dashboard.pending'), value: ordersData?.data.filter(o => o.status === 'PENDING').length || 0 },
    { name: t('dashboard.confirmed'), value: ordersData?.data.filter(o => o.status === 'CONFIRMED').length || 0 },
    { name: t('dashboard.processing'), value: ordersData?.data.filter(o => o.status === 'PROCESSING').length || 0 },
    { name: t('dashboard.shipped'), value: ordersData?.data.filter(o => o.status === 'SHIPPED').length || 0 },
    { name: t('dashboard.delivered'), value: ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0 },
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
  ];

  const productCategoryData = categoriesData?.data.map(cat => ({
    name: toStringValue(cat.name),
    products: productsData?.data.filter(p => p.categoryId === cat.id).length || 0,
  })) || [];

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const stats = [
    { title: t('dashboard.totalProducts'), value: totalProducts.toString(), icon: '📦', bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100', iconBg: 'bg-blue-500' },
    { title: t('dashboard.totalOrders'), value: totalOrders.toString(), icon: '🛒', bgColor: 'bg-gradient-to-br from-green-50 to-green-100', iconBg: 'bg-green-500' },
    { title: t('dashboard.totalUsers'), value: totalUsers.toString(), icon: '👥', bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100', iconBg: 'bg-purple-500' },
    { title: t('dashboard.revenue'), value: `$${totalRevenue.toLocaleString()}`, icon: '💰', bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100', iconBg: 'bg-yellow-500' },
    { title: t('dashboard.categories'), value: totalCategories.toString(), icon: '📁', bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100', iconBg: 'bg-pink-500' },
    { title: t('dashboard.pendingOrders'), value: pendingOrders.toString(), icon: '⏳', bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100', iconBg: 'bg-orange-500' },
  ];

  return (
    <div className="page-transition">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 animate-slide-in">{t('dashboard.title')}</h1>
        <p className="text-gray-600 animate-slide-in" style={{ animationDelay: '0.1s' }}>{t('dashboard.welcome')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`stats-card rounded-2xl p-6 ${stat.bgColor} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {analyticsData && (
        <section className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{t('dashboard.analytics')}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-100">
                <span className="text-sm text-gray-600">{t('dashboard.usersOnlineNow')}</span>
                <span className="font-bold text-purple-600 tabular-nums text-lg">{analyticsData.today.usersOnline}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">{t('dashboard.period')}</span>
              <div className="inline-flex rounded-xl bg-gray-100 p-1 gap-0.5">
                {[
                  { value: '', label: t('dashboard.none') },
                  { value: '7d', label: t('dashboard.7days') },
                  { value: '30d', label: t('dashboard.30days') },
                  { value: 'custom', label: t('dashboard.custom') },
                ].map(({ value, label }) => (
                  <button
                    key={value || 'none'}
                    type="button"
                    onClick={() => setDatePreset(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${datePreset === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {datePreset === 'custom' && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-1.5 pl-3 border border-gray-200/80">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-500/30 outline-none min-w-[140px] [color-scheme:light]"
                  />
                  <span className="text-gray-400 text-sm font-medium">→</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-purple-500/30 outline-none min-w-[140px] [color-scheme:light]"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 text-sm">📅</span>
                <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.today')}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">{analyticsData.today.label}</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.usersOnline')}</span><span className="font-semibold text-purple-600 tabular-nums">{analyticsData.today.usersOnline}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.bouquetsAdded')}</span><span className="font-semibold text-blue-600 tabular-nums">{analyticsData.today.bouquetsAdded}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.bids')}</span><span className="font-semibold text-emerald-600 tabular-nums">{analyticsData.today.bidsCount}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm">📆</span>
                <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.thisWeek')}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">{analyticsData.week.label}</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.usersOnline')}</span><span className="font-semibold text-purple-600 tabular-nums">{analyticsData.week.usersOnline}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.bouquetsAdded')}</span><span className="font-semibold text-blue-600 tabular-nums">{analyticsData.week.bouquetsAdded}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.bids')}</span><span className="font-semibold text-emerald-600 tabular-nums">{analyticsData.week.bidsCount}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 text-sm">📊</span>
                <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.totals')}</h3>
              </div>
              <div className="space-y-3 text-sm mt-7">
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.totalUsers')}</span><span className="font-bold text-gray-900 tabular-nums">{analyticsData.totals.totalUsers.toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">{t('dashboard.totalBouquets')}</span><span className="font-bold text-gray-900 tabular-nums">{analyticsData.totals.totalBouquets.toLocaleString()}</span></div>
              </div>
            </div>
            {analyticsData.customPeriod && (
              <div className="sm:col-span-3 rounded-2xl p-5 shadow-sm border border-purple-100 bg-gradient-to-br from-purple-50/80 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-200 text-purple-700 text-sm">📆</span>
                  <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.customRange')}</h3>
                  <span className="text-xs text-gray-500 font-normal">({analyticsData.customPeriod.label})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between sm:flex-col sm:justify-start gap-1 p-3 rounded-xl bg-white/60">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">{t('dashboard.from')}</span>
                    <span className="font-semibold text-gray-900">{analyticsData.customPeriod.dateFrom}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:justify-start gap-1 p-3 rounded-xl bg-white/60">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">{t('dashboard.to')}</span>
                    <span className="font-semibold text-gray-900">{analyticsData.customPeriod.dateTo}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:justify-start gap-1 p-3 rounded-xl bg-white/60">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">{t('dashboard.bouquetsAdded')}</span>
                    <span className="font-semibold text-blue-600 tabular-nums">{analyticsData.customPeriod.bouquetsAdded}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:justify-start gap-1 p-3 rounded-xl bg-white/60">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">{t('dashboard.bids')}</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">{analyticsData.customPeriod.bidsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.monthlyRevenue')}</h3>
          {totalRevenue === 0 && monthlyRevenue.every((d) => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">{t('dashboard.noRevenueData')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('dashboard.revenueWillAppear')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number | undefined) => [`$${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.orderStatusDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="45%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                formatter={(value, entry: { payload?: { value?: number } }) => `${value} (${entry?.payload?.value ?? 0})`}
                wrapperStyle={{ fontSize: '13px', color: '#374151' }}
              />
              <Tooltip
                formatter={(value: number | undefined) => [value ?? 0, 'Orders']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelFormatter={(label) => label}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {productCategoryData.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productCategoryData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tick={{ fill: '#64748b' }} />
              <YAxis stroke="#94a3b8" fontSize={12} tick={{ fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                formatter={(value: number | undefined) => [value ?? 0, 'Products']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ fontWeight: 600, color: '#374151' }}
              />
              <Bar dataKey="products" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.productsByCategory')}</h3>
          <div className="flex flex-col items-center justify-center h-[300px] text-center px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">{t('dashboard.noCategoriesYet')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('dashboard.addCategoriesHint')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 animate-fade-in card-animate" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/categories"
            className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-xl">📁</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('dashboard.manageCategories')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.organizeProducts')}</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/products"
            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('dashboard.manageProducts')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.addOrEditItems')}</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/orders"
            className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('dashboard.viewOrders')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.trackOrders')}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h3>
          <div className="space-y-3">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                0
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dashboard.noActivityYet')}</p>
                <p className="text-sm text-gray-600">{t('dashboard.startManaging')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.quickStats')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="font-medium text-gray-700">{t('dashboard.activeProducts')}</span>
              <span className="text-2xl font-bold text-blue-600">{totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-medium text-gray-700">{t('dashboard.completedOrders')}</span>
              <span className="text-2xl font-bold text-green-600">
                {ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
              <span className="font-medium text-gray-700">{t('dashboard.totalCategories')}</span>
              <span className="text-2xl font-bold text-purple-600">{totalCategories}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
