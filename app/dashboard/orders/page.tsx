'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { OrderStatus } from '@/types';
import { useTranslations } from '@/lib/translations';
import { Ban, DollarSign, AlertTriangle } from 'lucide-react';

function toStringValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && ('en' in value || 'uz' in value || 'ru' in value)) {
    const o = value as Record<string, unknown>;
    const s = o.en ?? o.uz ?? o.ru;
    return typeof s === 'string' ? s : '';
  }
  return String(value);
}

export default function OrdersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; orderId: string | null; newStatus: OrderStatus | null }>({
    isOpen: false,
    orderId: null,
    newStatus: null,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => orderService.getAll({ page, limit }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const STATUS_COLORS: Record<OrderStatus, string> = {
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('orders.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('orders.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('orders.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('orders.orderNumber')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.product')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.customer')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('orders.total')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.status')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('orders.date')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                    {t('orders.noOrders')}
                  </td>
                </tr>
              ) : (
                data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
                      #{order.orderNumber}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-gray-700 text-sm max-w-[120px] sm:max-w-[200px] truncate">{toStringValue(order.product?.title)}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-gray-700 text-sm">{order.buyer.phoneNumber}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 font-bold text-gray-900 text-sm whitespace-nowrap">
                      {order.amount}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      {order.status === 'DELIVERED' || order.status === 'CANCELLED' ? (
                        <span className="text-gray-400 text-xs sm:text-sm font-medium">—</span>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as OrderStatus;
                            if (newStatus === 'CANCELLED') {
                              setStatusConfirm({ isOpen: true, orderId: order.id, newStatus });
                            } else {
                              updateStatusMutation.mutate({
                                id: order.id,
                                status: newStatus
                              });
                            }
                          }}
                          className="text-xs sm:text-sm border-2 border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 font-bold focus:border-purple-500 focus:outline-none transition-all button-animate min-w-0"
                        >
                          {order.status === 'PROCESSING' && (
                            <>
                              <option value="PROCESSING">{t('dashboard.processing')}</option>
                              <option value="SHIPPED">{t('dashboard.shipped')}</option>
                              <option value="CANCELLED">{t('orders.cancelled')}</option>
                            </>
                          )}
                          {order.status === 'SHIPPED' && (
                            <>
                              <option value="SHIPPED">{t('dashboard.shipped')}</option>
                              <option value="DELIVERED">{t('dashboard.delivered')}</option>
                              <option value="CANCELLED">{t('orders.cancelled')}</option>
                            </>
                          )}
                        </select>
                      )}
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
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, orderId: null, newStatus: null })}
        onConfirm={() => {
          if (statusConfirm.orderId && statusConfirm.newStatus) {
            updateStatusMutation.mutate({
              id: statusConfirm.orderId,
              status: statusConfirm.newStatus
            });
          }
        }}
        title="Change Order Status"
        message={`Are you sure you want to change this order status to ${statusConfirm.newStatus}? This action ${statusConfirm.newStatus === 'CANCELLED' ? 'cannot be easily undone' : 'will update the order status'}.`}
        confirmText="Change Status"
        cancelText={t('common.cancel')}
        type={statusConfirm.newStatus === 'CANCELLED' ? "danger" : "warning"}
        icon={statusConfirm.newStatus === 'CANCELLED' ? <Ban className="w-8 h-8 text-red-600" /> : <AlertTriangle className="w-8 h-8 text-yellow-600" />}
      />
    </div>
  );
}
