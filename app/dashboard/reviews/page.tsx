'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reviewService,
  type Review,
  type UpdateReviewDto,
} from '@/services/review.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function reviewerName(r: Review['reviewer']): string {
  if (!r) return '—';
  const first = r.firstName ?? '';
  const last = r.lastName ?? '';
  if (first || last) return `${first} ${last}`.trim();
  return r.phoneNumber ?? '—';
}

function productTitle(p: Review['product']): string {
  if (!p) return '—';
  const t = p.title;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && 'en' in t) return String((t as { en?: string }).en ?? '');
  return '—';
}

export default function ReviewsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [minRating, setMinRating] = useState<string>('');
  const [isReportedFilter, setIsReportedFilter] = useState<boolean | ''>('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState<string>('');
  const [editComment, setEditComment] = useState('');
  const [editIsReported, setEditIsReported] = useState(false);
  const [editReportReason, setEditReportReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const query: Record<string, unknown> = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
  if (minRating !== '') {
    const n = Number(minRating);
    if (!Number.isNaN(n)) query.minRating = n;
  }
  if (isReportedFilter === true) query.isReported = true;
  if (isReportedFilter === false) query.isReported = false;

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', query],
    queryFn: () => reviewService.getAll(query as Parameters<typeof reviewService.getAll>[0]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewDto }) =>
      reviewService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review updated');
      setEditingReview(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
      setDeleteConfirm({ isOpen: false, id: null });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    const ratingNum = editRating === '' ? undefined : Number(editRating);
    if (ratingNum !== undefined && (ratingNum < 1 || ratingNum > 5)) {
      toast.error('Rating must be between 1 and 5');
      return;
    }
    const data: UpdateReviewDto = {};
    if (ratingNum !== undefined) data.rating = ratingNum;
    if (editComment !== undefined) data.comment = editComment || undefined;
    data.isReported = editIsReported;
    if (editIsReported && editReportReason.trim()) data.reportReason = editReportReason.trim();
    updateMutation.mutate({ id: editingReview.id, data });
  };

  const openEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(String(review.rating));
    setEditComment(review.comment ?? '');
    setEditIsReported(review.isReported);
    setEditReportReason(review.reportReason ?? '');
  };

  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 };
  const reviews = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto" />
        <p className="mt-4 text-gray-600">{t('reviews.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h1>
          <p className="text-sm text-gray-600 mt-0.5">{t('reviews.subtitle')}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Min rating:</span>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Reported:</span>
          <select
            value={isReportedFilter === '' ? '' : isReportedFilter ? 'yes' : 'no'}
            onChange={(e) =>
              setIsReportedFilter(e.target.value === '' ? '' : e.target.value === 'yes')
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="yes">Reported</option>
            <option value="no">Not reported</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-4 py-3 font-medium">Reviewer</th>
                <th className="px-4 py-3 font-medium">Reviewee</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium max-w-xs">Comment</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium w-24">Status</th>
                <th className="px-4 py-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {t('reviews.noReviews')}
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm">{reviewerName(review.reviewer)}</td>
                    <td className="px-4 py-3 text-sm">{reviewerName(review.reviewee)}</td>
                    <td className="px-4 py-3 text-sm max-w-[180px] truncate" title={productTitle(review.product)}>
                      {productTitle(review.product)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{review.rating}</span> ★
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {review.comment || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {review.isReported ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Reported
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(review)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: review.id })}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total {meta.total} · Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {editingReview && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditingReview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit review</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5)</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIsReported}
                  onChange={(e) => setEditIsReported(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Mark as reported</span>
              </label>
              {editIsReported && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report reason</label>
                  <Input
                    value={editReportReason}
                    onChange={(e) => setEditReportReason(e.target.value)}
                    placeholder="Reason for report"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingReview(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete review"
        message="Are you sure you want to delete this review? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteConfirm.id && deleteMutation.mutate(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        type="danger"
      />
    </div>
  );
}
