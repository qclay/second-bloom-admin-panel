'use client';

import { useTranslations } from '@/lib/translations';
import type { PaginationMeta } from '@/types';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}

export function Pagination({
  meta,
  onPageChange,
  limit = meta.limit,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const t = useTranslations();
  const { page, totalPages, total, hasNextPage, hasPreviousPage } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (totalPages <= 1 && total <= (limitOptions[0] ?? 10)) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4 px-2 sm:px-4 border-t border-gray-200 bg-gray-50/50">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 order-2 sm:order-1">
        <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
          {t('pagination.showing')}{' '}
          <span className="font-semibold">{from}</span>
          {' – '}
          <span className="font-semibold">{to}</span>
          {' '}
          {t('pagination.of')}{' '}
          <span className="font-semibold">{total}</span>
        </p>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-gray-600">{t('pagination.perPage')}</label>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none min-h-[36px] sm:min-h-0"
        >
          {t('pagination.previous')}
        </button>
        <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {t('pagination.page')} <span className="font-semibold">{page}</span> {t('pagination.of')} <span className="font-semibold">{totalPages || 1}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none min-h-[36px] sm:min-h-0"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}
