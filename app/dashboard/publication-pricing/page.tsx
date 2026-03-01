'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  publicationPricingService,
  type UpdatePublicationPriceDto,
} from '@/services/publication-pricing.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';

export default function PublicationPricingPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');

  const { data: currentPricing, isLoading: loadingCurrent } = useQuery({
    queryKey: ['publication-pricing-current'],
    queryFn: () => publicationPricingService.getCurrent(),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdatePublicationPriceDto) => publicationPricingService.updatePrice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-pricing-current'] });
      toast.success('Publication price updated');
      setPrice('');
      setDescription('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update price');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = price.trim() === '' ? NaN : Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error('Enter a valid price (number ≥ 0)');
      return;
    }
    updateMutation.mutate({
      price: priceNum,
      ...(description.trim() && { description: description.trim() }),
    });
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const isLoading = loadingCurrent;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="mt-4 text-gray-600">{t('common.loadingPublicationPricing')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('publicationPricing.title')}</h1>
        <p className="text-sm text-gray-600 mt-0.5">{t('publicationPricing.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('publicationPricing.currentPrice')}</h2>
          {currentPricing ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {Number(currentPricing.pricePerPost).toLocaleString()} {currentPricing.currency}
              </p>
              <p className="text-sm text-gray-500">
                {currentPricing.description || t('common.noDescription')}
              </p>
              <p className="text-xs text-gray-400">
                {t('publicationPricing.updated')} {formatDate(currentPricing.updatedAt)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">{t('publicationPricing.noActivePrice')}</p>
          )}
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('publicationPricing.updatePrice')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('publicationPricing.pricePerPost')}
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={currentPricing ? String(currentPricing.pricePerPost) : '25000'}
            />
            <Input
              label={t('publicationPricing.descriptionOptional')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Price adjusted for promotion"
            />
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.saving') : t('publicationPricing.saveNewPrice')}
            </Button>
          </form>
          <p className="mt-3 text-xs text-gray-500">{t('publicationPricing.savingHint')}</p>
        </div>
      </div>
    </div>
  );
}
