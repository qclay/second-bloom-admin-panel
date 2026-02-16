'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  publicationPricingService,
  type PublicationPricing,
  type UpdatePublicationPriceDto,
} from '@/services/publication-pricing.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PublicationPricingPage() {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');

  const { data: currentPricing, isLoading: loadingCurrent } = useQuery({
    queryKey: ['publication-pricing-current'],
    queryFn: () => publicationPricingService.getCurrent(),
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['publication-pricing-history'],
    queryFn: () => publicationPricingService.getHistory(),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdatePublicationPriceDto) => publicationPricingService.updatePrice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-pricing-current'] });
      queryClient.invalidateQueries({ queryKey: ['publication-pricing-history'] });
      toast.success('Publication price updated');
      setPrice('');
      setDescription('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update price');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => publicationPricingService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-pricing-current'] });
      queryClient.invalidateQueries({ queryKey: ['publication-pricing-history'] });
      toast.success('Price activated');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to activate');
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

  const isLoading = loadingCurrent || loadingHistory;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading publication pricing...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Publication Pricing</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Set the price per publication post. Users pay this amount per post when publishing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current active price</h2>
          {currentPricing ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {Number(currentPricing.pricePerPost).toLocaleString()} {currentPricing.currency}
              </p>
              <p className="text-sm text-gray-500">
                {currentPricing.description || 'No description'}
              </p>
              <p className="text-xs text-gray-400">
                Updated {formatDate(currentPricing.updatedAt)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No active price set.</p>
          )}
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update price</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Price per post (UZS)"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={currentPricing ? String(currentPricing.pricePerPost) : '25000'}
            />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Price adjusted for promotion"
            />
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save new price'}
            </Button>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Saving creates a new price and sets it as active; the previous price remains in history.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Price history</h2>
          <p className="text-sm text-gray-500">Activate a previous price to use it again.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-4 py-3 font-medium">Price (UZS)</th>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No price history yet.
                  </td>
                </tr>
              ) : (
                history.map((item: PublicationPricing) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">
                      {Number(item.pricePerPost).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{item.currency}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {!item.isActive && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => activateMutation.mutate(item.id)}
                          disabled={activateMutation.isPending}
                        >
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
