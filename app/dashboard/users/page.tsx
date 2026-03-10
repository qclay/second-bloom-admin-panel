'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { User as UserType } from '@/types';
import { useTranslations } from '@/lib/translations';

export default function UsersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [blockConfirm, setBlockConfirm] = useState<{ isOpen: boolean; user: UserType | null }>({
    isOpen: false,
    user: null,
  });
  const [roleConfirm, setRoleConfirm] = useState<{ isOpen: boolean; user: UserType | null; newRole: 'USER' | 'ADMIN' | null }>({
    isOpen: false,
    user: null,
    newRole: null,
  });
  const [addCreditsModal, setAddCreditsModal] = useState<{ user: UserType; amount: string } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm, page, limit],
    queryFn: () => userService.getAll({ search: searchTerm, page, limit }),
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.update(id, { isActive }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.isActive ? 'User unblocked successfully' : 'User blocked successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update user status');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      userService.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      userService.addPublicationCredits(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Publication credits added');
      setAddCreditsModal(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to add credits');
    },
  });

  const handleToggleBlock = (user: UserType) => {
    setBlockConfirm({ isOpen: true, user });
  };

  const handleRoleChange = (user: UserType, newRole: 'USER' | 'ADMIN') => {
    setRoleConfirm({ isOpen: true, user, newRole });
  };

  const confirmBlock = () => {
    if (blockConfirm.user) {
      toggleActiveMutation.mutate({ 
        id: blockConfirm.user.id, 
        isActive: !blockConfirm.user.isActive 
      });
    }
  };

  const confirmRoleChange = () => {
    if (roleConfirm.user && roleConfirm.newRole) {
      updateRoleMutation.mutate({ 
        id: roleConfirm.user.id, 
        role: roleConfirm.newRole 
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('users.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{t('users.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('users.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto sm:min-w-[200px]">
          <input
            type="text"
            placeholder={'🔍 ' + t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2 sm:px-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-bold text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-blue-200">
          <p className="text-xs sm:text-sm font-bold text-blue-600 mb-0.5 sm:mb-1">{t('users.totalUsers')}</p>
          <p className="text-xl sm:text-2xl font-black text-blue-900 tabular-nums">{data?.meta?.pagination?.total ?? data?.data?.length ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <p className="text-xs sm:text-sm font-bold text-green-600 mb-0.5 sm:mb-1">{t('users.activeUsers')}</p>
          <p className="text-xl sm:text-2xl font-black text-green-900 tabular-nums">
            {data?.data.filter(u => u.isActive).length || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-red-200">
          <p className="text-xs sm:text-sm font-bold text-red-600 mb-0.5 sm:mb-1">{t('users.blockedUsers')}</p>
          <p className="text-xl sm:text-2xl font-black text-red-900 tabular-nums">
            {data?.data.filter(u => !u.isActive).length || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-purple-200">
          <p className="text-xs sm:text-sm font-bold text-purple-600 mb-0.5 sm:mb-1">{t('users.admins')}</p>
          <p className="text-xl sm:text-2xl font-black text-purple-900 tabular-nums">
            {data?.data.filter(u => u.role === 'ADMIN').length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('users.user')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('users.contact')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('users.role')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase">{t('users.publicationPosts')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.status')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase whitespace-nowrap">{t('users.joined')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`table-row-animate ${!user.isActive ? 'bg-red-50' : ''} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.firstName?.[0] || user.phoneNumber[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {user.firstName || t('users.na')} {user.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500 truncate">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <p className="font-semibold text-gray-900 text-sm">{user.phoneNumber}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[140px] sm:max-w-none">{user.email || 'No email'}</p>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as 'USER' | 'ADMIN')}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold border-2 min-w-0 ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 tabular-nums text-sm">
                        {(user.publicationCredits ?? 0).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddCreditsModal({ user, amount: '' })}
                        className="text-xs h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
                      >
                        {t('users.givePosts')}
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? '✓ ' + t('users.active') : '🚫 ' + t('users.blocked')}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500 font-semibold whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleBlock(user)}
                        className={`button-animate ${user.isActive 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {user.isActive ? '🚫 ' + t('users.block') : '✓ ' + t('users.unblock')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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
        isOpen={blockConfirm.isOpen}
        onClose={() => setBlockConfirm({ isOpen: false, user: null })}
        onConfirm={confirmBlock}
        title={blockConfirm.user?.isActive ? t('users.block') : t('users.unblock')}
        message={blockConfirm.user?.isActive ? t('users.confirmBlock') : t('users.confirmUnblock')}
        confirmText={blockConfirm.user?.isActive ? t('users.block') : t('users.unblock')}
        cancelText={t('common.cancel')}
        type={blockConfirm.user?.isActive ? "danger" : "info"}
        icon={blockConfirm.user?.isActive ? "🚫" : "✓"}
      />

      <ConfirmDialog
        isOpen={roleConfirm.isOpen}
        onClose={() => setRoleConfirm({ isOpen: false, user: null, newRole: null })}
        onConfirm={confirmRoleChange}
        title="Change User Role"
        message={`Change ${roleConfirm.user?.firstName || roleConfirm.user?.phoneNumber}'s role to ${roleConfirm.newRole}? This will grant ${roleConfirm.newRole === 'ADMIN' ? 'administrative' : 'regular user'} privileges.`}
        confirmText="Change Role"
        cancelText={t('common.cancel')}
        type="warning"
        icon="👑"
      />

      {addCreditsModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setAddCreditsModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('users.addPosts')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {addCreditsModal.user.firstName || addCreditsModal.user.phoneNumber} — current balance:{' '}
              <strong>{(addCreditsModal.user.publicationCredits ?? 0).toLocaleString()}</strong>
            </p>
            <input
              type="number"
              min="1"
              step="1"
              placeholder={t('users.postsToAdd')}
              value={addCreditsModal.amount}
              onChange={(e) => setAddCreditsModal({ ...addCreditsModal, amount: e.target.value.replace(/\D/g, '').slice(0, 8) })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddCreditsModal(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!addCreditsModal.amount || parseInt(addCreditsModal.amount, 10) < 1}
                onClick={() => {
                  const amount = parseInt(addCreditsModal.amount, 10);
                  if (amount >= 1) {
                    addCreditsMutation.mutate({
                      id: addCreditsModal.user.id,
                      amount,
                    });
                  }
                }}
                isLoading={addCreditsMutation.isPending}
              >
                {t('users.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
