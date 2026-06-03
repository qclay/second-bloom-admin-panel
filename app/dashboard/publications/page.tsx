'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/translations';
import { PublicationsAnalyticsBlock } from '@/components/publications/analytics-block';

export default function PublicationsPage() {
  const t = useTranslations();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('publications.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('publications.subtitle')}</p>
      </div>

      <PublicationsAnalyticsBlock
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
