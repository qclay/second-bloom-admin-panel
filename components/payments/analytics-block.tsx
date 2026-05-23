'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { paymentService } from '@/services/payment.service';
import { useTranslations, type TranslationKey } from '@/lib/translations';
import { PaymentSource } from '@/types';

type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

interface AnalyticsBlockProps {
  source?: PaymentSource;
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
}

const PERIODS: { value: AnalyticsPeriod; labelKey: TranslationKey }[] = [
  { value: '7d', labelKey: 'payments.analytics.period7d' },
  { value: '30d', labelKey: 'payments.analytics.period30d' },
  { value: '90d', labelKey: 'payments.analytics.period90d' },
  { value: 'all', labelKey: 'payments.analytics.periodAll' },
];

const formatMoney = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function AnalyticsBlock({ source, period, onPeriodChange }: AnalyticsBlockProps) {
  const t = useTranslations();

  const { data, isLoading } = useQuery({
    queryKey: ['payments-analytics', period, source],
    queryFn: () => paymentService.getAnalytics({ period, source }),
  });

  const totalBySource = (data?.bySource ?? []).reduce((s, x) => s + x.revenue, 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
          {t('payments.analytics.title')}
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          label={t('payments.analytics.totalRevenue')}
          value={isLoading ? '…' : `${formatMoney(data?.kpi.totalRevenue ?? 0)} UZS`}
          accent="from-green-500 to-emerald-500"
        />
        <KpiCard
          label={t('payments.analytics.totalTransactions')}
          value={isLoading ? '…' : String(data?.kpi.totalTransactions ?? 0)}
          subtitle={isLoading ? '' : `${data?.kpi.completedTransactions ?? 0} ${t('payments.analytics.completedHint')}`}
          accent="from-blue-500 to-cyan-500"
        />
        <KpiCard
          label={t('payments.analytics.successRate')}
          value={isLoading ? '…' : formatPct(data?.kpi.successRate ?? 0)}
          accent="from-purple-500 to-pink-500"
        />
        <KpiCard
          label={t('payments.analytics.avgTicket')}
          value={isLoading ? '…' : `${formatMoney(data?.kpi.avgTicket ?? 0)} UZS`}
          accent="from-amber-500 to-orange-500"
        />
        <KpiCard
          label={t('payments.analytics.pending')}
          value={isLoading ? '…' : String(data?.kpi.pendingCount ?? 0)}
          accent="from-yellow-500 to-amber-500"
        />
      </div>

      {/* Source split + daily revenue chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('payments.analytics.sourceSplit')}
          </h3>
          {isLoading || !data ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">…</div>
          ) : (
            <div className="space-y-3">
              {data.bySource.map((row) => {
                const share = totalBySource > 0 ? row.revenue / totalBySource : 0;
                const color = row.source === 'APP' ? 'bg-purple-500' : 'bg-sky-500';
                const label = row.source === 'APP' ? t('payments.sourceApp') : t('payments.sourceBot');
                return (
                  <div key={row.source}>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                      <span className="font-bold text-slate-700">{label}</span>
                      <span className="font-mono text-slate-900">{formatMoney(row.revenue)} UZS</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${(share * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{row.count} tx</span>
                      <span>{formatPct(share)}</span>
                    </div>
                  </div>
                );
              })}
              {data.bySource.every((r) => r.revenue === 0) && (
                <div className="text-sm text-slate-400 text-center py-4">{t('payments.analytics.noData')}</div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('payments.analytics.dailyRevenue')}
          </h3>
          <div className="h-56">
            {isLoading || !data ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">…</div>
            ) : data.timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {t('payments.analytics.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => formatMoney(Number(v))} />
                  <Tooltip
                    formatter={(v) => [`${formatMoney(Number(v ?? 0))} UZS`, t('payments.analytics.totalRevenue')]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#rev-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* By payment type */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {t('payments.analytics.byType')}
        </h3>
        {isLoading || !data ? (
          <div className="h-16 flex items-center justify-center text-slate-400 text-sm">…</div>
        ) : data.byType.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">{t('payments.analytics.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 pr-4">{t('payments.type')}</th>
                  <th className="py-2 pr-4 text-right">{t('payments.analytics.totalRevenue')}</th>
                  <th className="py-2 pr-4 text-right">{t('payments.analytics.totalTransactions')}</th>
                  <th className="py-2 text-right">{t('payments.analytics.avgTicket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.byType.map((row) => (
                  <tr key={row.paymentType}>
                    <td className="py-2 pr-4 font-bold text-slate-700">{row.paymentType}</td>
                    <td className="py-2 pr-4 text-right font-mono text-slate-900">{formatMoney(row.revenue)} UZS</td>
                    <td className="py-2 pr-4 text-right text-slate-700">{row.count}</td>
                    <td className="py-2 text-right font-mono text-slate-700">{formatMoney(row.avgTicket)} UZS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900 truncate">{value}</div>
      {subtitle ? <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div> : null}
    </div>
  );
}
