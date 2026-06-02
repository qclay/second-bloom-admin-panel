'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { Pagination } from '@/components/ui/pagination';
import { useTranslations } from '@/lib/translations';
import { PaymentSource, AdminPaymentStatus } from '@/types';

type StatusFilter = AdminPaymentStatus | 'ALL';
const STATUS_FILTER_OPTIONS: StatusFilter[] = ['ALL', 'COMPLETED', 'PENDING', 'EXPIRED'];
import { AnalyticsBlock } from '@/components/payments/analytics-block';

const STATUS_COLORS: Record<AdminPaymentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
};

const SOURCE_COLORS: Record<PaymentSource, string> = {
  APP: 'bg-purple-100 text-purple-700',
  BOT: 'bg-sky-100 text-sky-700',
};

type SourceFilter = PaymentSource | 'ALL';

export default function PaymentsPage() {
  const t = useTranslations();
  const [source, setSource] = useState<SourceFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', source, status, page, limit],
    queryFn: () =>
      paymentService.getAll({
        page,
        limit,
        ...(source !== 'ALL' && { source }),
        ...(status !== 'ALL' && { status }),
      }),
  });

  const formatUser = (p: { user?: { phoneNumber?: string; firstName?: string | null; lastName?: string | null; username?: string | null } }): string => {
    if (!p.user) return '—';
    const name = [p.user.firstName, p.user.lastName].filter(Boolean).join(' ');
    if (name) return `${name} (${p.user.phoneNumber})`;
    if (p.user.username) return `@${p.user.username} (${p.user.phoneNumber})`;
    return p.user.phoneNumber || '—';
  };

  const formatAmount = (amount: number): string =>
    new Intl.NumberFormat('ru-RU').format(amount) + ' UZS';

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleString('ru-RU');

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('payments.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('payments.subtitle')}</p>
      </div>

      <AnalyticsBlock
        source={source === 'ALL' ? undefined : source}
        period={period}
        onPeriodChange={setPeriod}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 min-w-[64px]">
          {t('payments.source')}:
        </span>
        {(['APP', 'BOT', 'ALL'] as SourceFilter[]).map((opt) => {
          const labelKey =
            opt === 'APP' ? 'payments.sourceApp' : opt === 'BOT' ? 'payments.sourceBot' : 'payments.sourceAll';
          const isActive = source === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { setSource(opt); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-slate-600 hover:border-purple-300'
              }`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 min-w-[64px]">
          {t('payments.statusFilter')}:
        </span>
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const isActive = status === opt;
          const label =
            opt === 'ALL' ? t('payments.statusAll') :
            opt === 'COMPLETED' ? 'Completed' :
            opt === 'PENDING' ? 'Pending' : 'Expired';
          const activeClass =
            opt === 'COMPLETED' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' :
            opt === 'PENDING' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md' :
            opt === 'EXPIRED' ? 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-md' :
            'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md';
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { setStatus(opt); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? activeClass
                  : 'bg-white border border-gray-200 text-slate-600 hover:border-purple-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('payments.loading')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto -mx-px">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.date')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.user')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.type')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.quantity')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.amount')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.gateway')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.status')}</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('payments.source')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
                      {t('payments.noPayments')}
                    </td>
                  </tr>
                ) : (
                  data.data.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs text-gray-700 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-900">{formatUser(p)}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs text-gray-700 whitespace-nowrap">{p.paymentType}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-700">{p.quantity}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{formatAmount(p.amount)}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs text-gray-700">{p.gateway ?? '—'}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${SOURCE_COLORS[p.source]}`}>
                          {p.source === 'APP' ? t('payments.sourceApp') : t('payments.sourceBot')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data?.meta?.pagination && (
            <Pagination
              meta={data.meta.pagination}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
