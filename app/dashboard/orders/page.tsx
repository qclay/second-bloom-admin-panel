'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/types';

export default function OrdersPage() {
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
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{order.product.title}</td>
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
                          // Show confirmation for critical status changes
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
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Confirmation */}
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
        cancelText="Cancel"
        type={statusConfirm.newStatus === 'CANCELLED' || statusConfirm.newStatus === 'REFUNDED' ? "danger" : "warning"}
        icon={statusConfirm.newStatus === 'CANCELLED' ? "🚫" : statusConfirm.newStatus === 'REFUNDED' ? "💰" : "⚠️"}
      />
    </div>
  );
}
