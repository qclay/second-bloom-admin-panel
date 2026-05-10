'use client';

import { useState } from 'react';
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
    <div className="w-full max-w-full min-w-0 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">
            {t('users.title')}
          </h1>
          <p className="text-slate-500 font-medium">{t('users.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto sm:min-w-[300px]">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input-premium pl-11 !font-bold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: t('users.totalUsers'), value: data?.meta?.pagination?.total ?? data?.data?.length ?? 0, color: 'from-blue-500 to-cyan-400' },
          { label: t('users.activeUsers'), value: data?.data.filter(u => u.isActive).length || 0, color: 'from-emerald-500 to-teal-400' },
          { label: t('users.blockedUsers'), value: data?.data.filter(u => !u.isActive).length || 0, color: 'from-rose-500 to-pink-400' },
          { label: t('users.admins'), value: data?.data.filter(u => u.role === 'ADMIN').length || 0, color: 'from-purple-500 to-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums group-hover:scale-110 transition-transform duration-300 origin-left">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>{t('users.user')}</th>
                <th>{t('users.contact')}</th>
                <th>{t('users.role')}</th>
                <th className="text-right">{t('users.publicationPosts')}</th>
                <th>{t('common.status')}</th>
                <th>{t('users.joined')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`table-row-animate ${!user.isActive ? 'bg-red-50' : ''} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="!bg-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-sm transition-transform group-hover:rotate-12 group-hover:scale-110">
                        {user.firstName?.[0] || user.phoneNumber[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm tracking-tight truncate">
                          {user.firstName || t('users.na')} {user.lastName || ''}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <p className="font-semibold text-gray-900 text-sm">{user.phoneNumber}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[140px] sm:max-w-none">{user.email || 'No email'}</p>
                  </td>
                  <td className="!bg-transparent">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as 'USER' | 'ADMIN')}
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-2 transition-all ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
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
                        className={`rounded-xl font-black text-[10px] tracking-widest uppercase px-4 h-8 transition-all active:scale-95 ${user.isActive 
                          ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" 
                          : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                        } shadow-lg`}
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
