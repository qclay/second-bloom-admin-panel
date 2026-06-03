'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { productService } from '@/services/product.service';
import { useTranslations, type TranslationKey } from '@/lib/translations';

type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

interface PublicationsAnalyticsBlockProps {
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
}

const PERIODS: { value: AnalyticsPeriod; labelKey: TranslationKey }[] = [
  { value: '7d', labelKey: 'publications.analytics.period7d' },
  { value: '30d', labelKey: 'publications.analytics.period30d' },
  { value: '90d', labelKey: 'publications.analytics.period90d' },
  { value: 'all', labelKey: 'publications.analytics.periodAll' },
];

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#22c55e',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  DRAFT: '#94a3b8',
};

const STATUS_BG: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-700',
};

const SOURCE_COLORS: Record<string, string> = {
  APP: '#a855f7',
  BOT: '#0ea5e9',
  UNKNOWN: '#94a3b8',
};

const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function PublicationsAnalyticsBlock({ period, onPeriodChange }: PublicationsAnalyticsBlockProps) {
  const t = useTranslations();

  const { data, isLoading } = useQuery({
    queryKey: ['publications-analytics', period],
    queryFn: () => productService.getAnalytics({ period }),
  });

  const kpi = data?.kpi;
  const total = kpi?.total ?? 0;
  const published = kpi?.published ?? 0;
  const pending = kpi?.pending ?? 0;
  const rejected = kpi?.rejected ?? 0;

  const totalBySource = (data?.bySource ?? []).reduce((s, x) => s + x.count, 0);

  const sourceLabel = (src: string) => {
    if (src === 'APP') return t('publications.analytics.sourceApp');
    return t('publications.analytics.sourceBot');
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
          {t('publications.analytics.title')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => {
            const isActive = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onPeriodChange(p.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {t(p.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          {t('publications.analytics.title')}
        </div>
        {isLoading ? (
          <div className="text-slate-400 text-sm">…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('publications.analytics.total')}</div>
              <div className="text-2xl font-black text-white mt-0.5">{total}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('publications.analytics.published')}</div>
              <div className="text-2xl font-black text-green-400 mt-0.5">{published}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{total > 0 ? formatPct(published / total) : '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('publications.analytics.pending')}</div>
              <div className="text-2xl font-black text-yellow-400 mt-0.5">{pending}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{total > 0 ? formatPct(pending / total) : '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('publications.analytics.rejected')}</div>
              <div className="text-2xl font-black text-red-400 mt-0.5">{rejected}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{total > 0 ? formatPct(rejected / total) : '—'}</div>
            </div>
          </div>
        )}
        {/* Status bar */}
        {!isLoading && total > 0 && (
          <div className="mt-4">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(published / total * 100).toFixed(1)}%` }} />
              <div className="h-full bg-yellow-400 transition-all" style={{ width: `${(pending / total * 100).toFixed(1)}%` }} />
              <div className="h-full bg-red-400 transition-all" style={{ width: `${(rejected / total * 100).toFixed(1)}%` }} />
            </div>
            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Published {total > 0 ? formatPct(published / total) : ''}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Pending {total > 0 ? formatPct(pending / total) : ''}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Rejected {total > 0 ? formatPct(rejected / total) : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Source split + daily chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('publications.analytics.sourceSplit')}
          </h3>
          {isLoading || !data ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">…</div>
          ) : (
            <div className="space-y-3">
              {data.bySource.map((row) => {
                const share = totalBySource > 0 ? row.count / totalBySource : 0;
                const colorClass = row.source === 'APP' ? 'bg-purple-500' : 'bg-sky-500';
                return (
                  <div key={row.source}>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                      <span className="font-bold text-slate-700">{sourceLabel(row.source)}</span>
                      <span className="font-mono text-slate-900">{row.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} transition-all`} style={{ width: `${(share * 100).toFixed(1)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{row.source}</span>
                      <span>{formatPct(share)}</span>
                    </div>
                  </div>
                );
              })}
              {data.bySource.every((r) => r.count === 0) && (
                <div className="text-sm text-slate-400 text-center py-4">{t('publications.analytics.noData')}</div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('publications.analytics.dailyChart')}
          </h3>
          <div className="h-56">
            {isLoading || !data ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">…</div>
            ) : data.timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {t('publications.analytics.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pub-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [String(v), t('publications.analytics.perDay')]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#pub-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* By status table + bar chart */}
      {(isLoading || (data?.byStatus && data.byStatus.length > 0)) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('publications.analytics.byStatus')}
          </h3>
          {isLoading || !data ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">…</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2 pr-4">{t('common.status')}</th>
                      <th className="py-2 pr-4 text-right">{t('publications.analytics.count')}</th>
                      <th className="py-2 text-right">{t('publications.analytics.share')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.byStatus.map((row) => {
                      const share = total > 0 ? row.count / total : 0;
                      return (
                        <tr key={row.status}>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BG[row.status] ?? 'bg-slate-100 text-slate-700'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right text-slate-700">{row.count}</td>
                          <td className="py-2 text-right text-slate-500">{formatPct(share)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byStatus} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.byStatus.map((row) => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status] ?? '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
