'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '@/services/request.service';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { BouquetRequestImage, BouquetRequestStatus } from '@/types';
import { useTranslations } from '@/lib/translations';
import { Trash2, Flower2 } from 'lucide-react';

export default function RequestsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BouquetRequestStatus | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; requestId: string | null }>({
    isOpen: false,
    requestId: null,
  });
  const [gallery, setGallery] = useState<BouquetRequestImage[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', statusFilter, page, limit],
    queryFn: () =>
      requestService.getAll(
        statusFilter ? { status: statusFilter, page, limit } : { page, limit },
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: requestService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('requests.deleted'));
      setDeleteConfirm({ isOpen: false, requestId: null });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || t('requests.deleteFailed'));
    },
  });

  const STATUS_COLORS: Record<BouquetRequestStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="mt-4 text-gray-600">{t('requests.loading')}</p>
      </div>
    );
  }

  const requests = data?.data ?? [];

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('requests.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('requests.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {([
          { value: '', label: t('requests.all') },
          { value: 'ACTIVE', label: t('requests.active') },
          { value: 'CLOSED', label: t('requests.closed') },
        ] as const).map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => {
              setStatusFilter(value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              statusFilter === value
                ? 'bg-slate-900 text-white shadow-xl scale-105'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('requests.photo')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('requests.buyer')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('requests.budget')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('requests.targetDate')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.status')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('requests.offers')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('requests.created')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                    <div className="flex flex-col items-center gap-2">
                      <Flower2 className="w-8 h-8 text-gray-300" />
                      {t('requests.noRequests')}
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      {request.images.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setGallery(request.images)}
                          className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={request.images[0].url}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                          {request.images.length > 1 && (
                            <span className="absolute bottom-0 right-0 px-1 text-[9px] font-bold text-white bg-black/60 rounded-tl">
                              +{request.images.length - 1}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                          <Flower2 className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm">
                      <p className="font-semibold text-gray-900">
                        {request.buyer?.firstName || ''} {request.buyer?.lastName || ''}
                        {!request.buyer?.firstName && !request.buyer?.lastName && t('users.na')}
                      </p>
                      <p className="text-gray-500 text-xs">{request.buyer?.phoneNumber ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 font-bold text-gray-900 text-sm whitespace-nowrap">
                      {request.budget.toLocaleString()} {request.currency}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {new Date(request.targetDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status]}`}>
                        {request.status === 'ACTIVE' ? t('requests.active') : t('requests.closed')}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-700">
                      {request.offersCount ?? 0}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <Trash2
                        role="button"
                        aria-label={t('common.delete')}
                        onClick={() => setDeleteConfirm({ isOpen: true, requestId: request.id })}
                        className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer transition-transform active:scale-95"
                      />
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
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, requestId: null })}
        onConfirm={() => {
          if (deleteConfirm.requestId) {
            deleteMutation.mutate(deleteConfirm.requestId);
          }
        }}
        title={t('requests.confirmDeleteTitle')}
        message={t('requests.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        icon={<Trash2 className="w-8 h-8 text-red-600" />}
        closeOnConfirm={false}
        isLoading={deleteMutation.isPending}
      />

      {gallery && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setGallery(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img) => (
                <div key={img.fileId} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
