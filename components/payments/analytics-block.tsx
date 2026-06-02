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
  Legend,
} from 'recharts';
import { paymentService } from '@/services/payment.service';
import { useTranslations, type TranslationKey } from '@/lib/translations';
import { AdminPaymentStatus, PaymentSource } from '@/types';

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

const STATUS_COLORS: Record<AdminPaymentStatus, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
};

const STATUS_BAR_COLORS: Record<AdminPaymentStatus, string> = {
  COMPLETED: '#22c55e',
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  FAILED: '#ef4444',
  EXPIRED: '#94a3b8',
};

const formatMoney = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function AnalyticsBlock({ source, period, onPeriodChange }: AnalyticsBlockProps) {
  const t = useTranslations();

  const { data, isLoading } = useQuery({
    queryKey: ['payments-analytics', period, source],
    queryFn: () => paymentService.getAnalytics({ period, source }),
  });

  const totalBySource = (data?.bySource ?? []).reduce((s, x) => s + x.revenue, 0);

  // Derived financial metrics
  const kpi = data?.kpi;
  const completedRevenue = kpi?.totalRevenue ?? 0;
  const avgTicket = kpi?.avgTicket ?? 0;
  const pendingCount = kpi?.pendingCount ?? 0;
  const completedCount = kpi?.completedTransactions ?? 0;
  const totalTx = kpi?.totalTransactions ?? 0;
  const failedCount = kpi?.failedCount ?? (totalTx - completedCount - pendingCount);
  const expiredCount = kpi?.expiredCount ?? 0;
  const nonCompletedCount = totalTx - completedCount - pendingCount;
  const pendingRevenueEst = Math.round(pendingCount * avgTicket);

  return (
    <div className="mb-6 space-y-4">
      {/* Header + period selector */}
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

      {/* Financial summary banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          {t('payments.analytics.financialSummary')}
        </div>
        {isLoading ? (
          <div className="text-slate-400 text-sm">…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('payments.analytics.confirmedRevenue')}</div>
              <div className="text-2xl font-black text-green-400 mt-0.5">{formatMoney(completedRevenue)} <span className="text-sm font-bold text-slate-300">UZS</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">{completedCount} {t('payments.analytics.completedHint')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('payments.analytics.pendingRevenue')}</div>
              <div className="text-2xl font-black text-yellow-400 mt-0.5">{formatMoney(pendingRevenueEst)} <span className="text-sm font-bold text-slate-300">UZS</span></div>
              <div className="text-[11px] text-slate-400 mt-0.5">{pendingCount} tx</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('payments.analytics.lostCount')}</div>
              <div className="text-2xl font-black text-red-400 mt-0.5">{nonCompletedCount > 0 ? nonCompletedCount : (failedCount + expiredCount)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{formatPct(kpi?.successRate ?? 0)} {t('payments.analytics.successRate').toLowerCase()}</div>
            </div>
          </div>
        )}
        {/* Conversion bar */}
        {!isLoading && totalTx > 0 && (
          <div className="mt-4">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(completedCount / totalTx * 100).toFixed(1)}%` }}
              />
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${(pendingCount / totalTx * 100).toFixed(1)}%` }}
              />
              <div
                className="h-full bg-red-400 transition-all"
                style={{ width: `${(Math.max(0, totalTx - completedCount - pendingCount) / totalTx * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Completed {formatPct(completedCount / totalTx)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Pending {formatPct(pendingCount / totalTx)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Other {formatPct(Math.max(0, totalTx - completedCount - pendingCount) / totalTx)}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label={t('payments.analytics.totalTransactions')}
          value={isLoading ? '…' : String(totalTx)}
          subtitle={isLoading ? '' : `${completedCount} ${t('payments.analytics.completedHint')}`}
          accent="from-blue-500 to-cyan-500"
        />
        <KpiCard
          label={t('payments.analytics.successRate')}
          value={isLoading ? '…' : formatPct(kpi?.successRate ?? 0)}
          accent="from-purple-500 to-pink-500"
        />
        <KpiCard
          label={t('payments.analytics.avgTicket')}
          value={isLoading ? '…' : `${formatMoney(avgTicket)} UZS`}
          accent="from-amber-500 to-orange-500"
        />
        <KpiCard
          label={t('payments.analytics.pending')}
          value={isLoading ? '…' : String(pendingCount)}
          subtitle={isLoading ? '' : `≈ ${formatMoney(pendingRevenueEst)} UZS`}
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
                  <YAxis yAxisId="rev" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => formatMoney(Number(v))} />
                  <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v, name) =>
                      name === 'revenue'
                        ? [`${formatMoney(Number(v ?? 0))} UZS`, t('payments.analytics.totalRevenue')]
                        : [String(v), t('payments.analytics.txPerDay')]
                    }
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend formatter={(v) => v === 'revenue' ? t('payments.analytics.totalRevenue') : t('payments.analytics.txPerDay')} wrapperStyle={{ fontSize: 10 }} />
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#rev-grad)"
                  />
                  <Area
                    yAxisId="cnt"
                    type="monotone"
                    dataKey="count"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    fill="none"
                    strokeDasharray="4 2"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* By status breakdown (if backend returns byStatus) */}
      {(isLoading || (data?.byStatus && data.byStatus.length > 0)) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('payments.analytics.byStatus')}
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
                      <th className="py-2 pr-4 text-right">{t('payments.analytics.totalRevenue')}</th>
                      <th className="py-2 pr-4 text-right">{t('payments.analytics.count')}</th>
                      <th className="py-2 text-right">{t('payments.analytics.share')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.byStatus!.map((row) => {
                      const total = data.byStatus!.reduce((s, r) => s + r.count, 0);
                      const share = total > 0 ? row.count / total : 0;
                      return (
                        <tr key={row.status}>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[row.status]}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right font-mono text-slate-900">{formatMoney(row.revenue)} UZS</td>
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
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.byStatus!.map((row) => (
                        <Cell key={row.status} fill={STATUS_BAR_COLORS[row.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

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
                  <th className="py-2 pr-4 text-right">{t('payments.analytics.count')}</th>
                  <th className="py-2 pr-4 text-right">{t('payments.analytics.share')}</th>
                  <th className="py-2 text-right">{t('payments.analytics.avgTicket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(() => {
                  const totalTypeRevenue = data.byType.reduce((s, r) => s + r.revenue, 0);
                  return data.byType.map((row) => (
                    <tr key={row.paymentType}>
                      <td className="py-2 pr-4 font-bold text-slate-700">{row.paymentType}</td>
                      <td className="py-2 pr-4 text-right font-mono text-slate-900">{formatMoney(row.revenue)} UZS</td>
                      <td className="py-2 pr-4 text-right text-slate-700">{row.count}</td>
                      <td className="py-2 pr-4 text-right text-slate-500">
                        {totalTypeRevenue > 0 ? formatPct(row.revenue / totalTypeRevenue) : '—'}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-700">{formatMoney(row.avgTicket)} UZS</td>
                    </tr>
                  ));
                })()}
              </tbody>
              <tfoot className="border-t-2 border-slate-200">
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">ИТОГО</td>
                  <td className="py-2 pr-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(data.byType.reduce((s, r) => s + r.revenue, 0))} UZS
                  </td>
                  <td className="py-2 pr-4 text-right font-bold text-slate-900">
                    {data.byType.reduce((s, r) => s + r.count, 0)}
                  </td>
                  <td className="py-2 pr-4 text-right font-bold text-slate-500">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* By gateway (if backend returns byGateway) */}
      {(isLoading || (data?.byGateway && data.byGateway.length > 0)) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('payments.analytics.byGateway')}
          </h3>
          {isLoading || !data ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2 pr-4">{t('payments.gateway')}</th>
                    <th className="py-2 pr-4 text-right">{t('payments.analytics.totalRevenue')}</th>
                    <th className="py-2 pr-4 text-right">{t('payments.analytics.count')}</th>
                    <th className="py-2 pr-4 text-right">{t('payments.analytics.share')}</th>
                    <th className="py-2 text-right">{t('payments.analytics.avgTicket')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const totalGwRevenue = data.byGateway!.reduce((s, r) => s + r.revenue, 0);
                    return data.byGateway!.map((row) => (
                      <tr key={row.gateway}>
                        <td className="py-2 pr-4 font-bold text-slate-700">{row.gateway}</td>
                        <td className="py-2 pr-4 text-right font-mono text-slate-900">{formatMoney(row.revenue)} UZS</td>
                        <td className="py-2 pr-4 text-right text-slate-700">{row.count}</td>
                        <td className="py-2 pr-4 text-right text-slate-500">
                          {totalGwRevenue > 0 ? formatPct(row.revenue / totalGwRevenue) : '—'}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-700">{formatMoney(row.avgTicket)} UZS</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
