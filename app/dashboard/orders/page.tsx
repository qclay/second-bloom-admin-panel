'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { OrderStatus } from '@/types';
import { useTranslations } from '@/lib/translations';

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

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAll({}),
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
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('orders.title')}</h1>
        <p className="text-gray-600 mt-1">{t('orders.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.orderNumber')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.product')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.customer')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.total')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.status')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('orders.date')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('orders.noOrders')}
                  </td>
                </tr>
              ) : (
                data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{toStringValue(order.product?.title)}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {order.buyer.phoneNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ${order.totalPrice}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as OrderStatus;
                          if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED' || (order.status === 'DELIVERED' && newStatus !== 'DELIVERED')) {
                            setStatusConfirm({ isOpen: true, orderId: order.id, newStatus });
                          } else {
                            updateStatusMutation.mutate({
                              id: order.id,
                              status: newStatus
                            });
                          }
                        }}
                        className="text-sm border-2 border-gray-300 rounded-lg px-3 py-2 font-bold focus:border-purple-500 focus:outline-none transition-all button-animate"
                      >
                        <option value="PENDING">{t('dashboard.pending')}</option>
                        <option value="CONFIRMED">{t('dashboard.confirmed')}</option>
                        <option value="PROCESSING">{t('dashboard.processing')}</option>
                        <option value="SHIPPED">{t('dashboard.shipped')}</option>
                        <option value="DELIVERED">{t('dashboard.delivered')}</option>
                        <option value="CANCELLED">{t('orders.cancelled')}</option>
                        <option value="REFUNDED">{t('orders.refunded')}</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        message={`Are you sure you want to change this order status to ${statusConfirm.newStatus}? This action ${statusConfirm.newStatus === 'CANCELLED' || statusConfirm.newStatus === 'REFUNDED' ? 'cannot be easily undone' : 'will update the order status'}.`}
        confirmText="Change Status"
        cancelText={t('common.cancel')}
        type={statusConfirm.newStatus === 'CANCELLED' || statusConfirm.newStatus === 'REFUNDED' ? "danger" : "warning"}
        icon={statusConfirm.newStatus === 'CANCELLED' ? "🚫" : statusConfirm.newStatus === 'REFUNDED' ? "💰" : "⚠️"}
      />
    </div>
  );
}
