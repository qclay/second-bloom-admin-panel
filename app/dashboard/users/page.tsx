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
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, Check, Ban, Crown, Users } from 'lucide-react';

export default function UsersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [telegramSearch, setTelegramSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'USER' | 'ADMIN' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'blocked' | ''>('');

  const rawDebounced = useDebounce(searchTerm, 400);
  const debouncedSearch = /^[+\d\s\-()]+$/.test(rawDebounced) && rawDebounced.replace(/\D/g, '').length >= 3
    ? rawDebounced.replace(/[\s\-()]/g, '')
    : rawDebounced;
  const debouncedTelegram = useDebounce(telegramSearch, 400);

  const [blockConfirm, setBlockConfirm] = useState<{ isOpen: boolean; user: UserType | null }>({ isOpen: false, user: null });
  const [roleConfirm, setRoleConfirm] = useState<{ isOpen: boolean; user: UserType | null; newRole: 'USER' | 'ADMIN' | null }>({ isOpen: false, user: null, newRole: null });
  const [addCreditsModal, setAddCreditsModal] = useState<{ user: UserType; amount: string } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => { setPage(1); }, [debouncedSearch, debouncedTelegram, roleFilter, statusFilter]);

  const hasFilters = !!(searchTerm || telegramSearch || roleFilter || statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, debouncedTelegram, roleFilter, statusFilter, page, limit],
    queryFn: () => userService.getAll({
      search: debouncedSearch || undefined,
      telegramChatId: debouncedTelegram || undefined,
      role: roleFilter || undefined,
      isActive: statusFilter === 'active' ? true : statusFilter === 'blocked' ? false : undefined,
      page,
      limit,
    }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.update(id, { isActive }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.isActive ? 'User unblocked' : 'User blocked');
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
      toast.success('Role updated');
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

  const clearFilters = () => {
    setSearchTerm('');
    setTelegramSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('users.loading')}</p>
        </div>
      </div>
    );
  }

  const total = data?.meta?.pagination?.total ?? 0;

  return (
    <div className="w-full max-w-full min-w-0 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">{t('users.title')}</h1>
          <p className="text-slate-500 font-medium">{t('users.subtitle')}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('users.totalUsers'), value: total, color: 'from-blue-500 to-cyan-400' },
          { label: t('users.activeUsers'), value: data?.data.filter(u => u.isActive).length ?? 0, color: 'from-emerald-500 to-teal-400' },
          { label: t('users.blockedUsers'), value: data?.data.filter(u => !u.isActive).length ?? 0, color: 'from-rose-500 to-pink-400' },
          { label: t('users.admins'), value: data?.data.filter(u => u.role === 'ADMIN').length ?? 0, color: 'from-purple-500 to-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums pl-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Main search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Telegram ID search */}
          <div className="relative sm:w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none select-none">TG</span>
            <input
              type="text"
              placeholder="Telegram Chat ID"
              value={telegramSearch}
              onChange={(e) => setTelegramSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
            />
            {telegramSearch && (
              <button
                onClick={() => setTelegramSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'USER' | 'ADMIN' | '')}
            className="sm:w-32 py-2.5 px-3 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all cursor-pointer text-slate-700"
          >
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'blocked' | '')}
            className="sm:w-36 py-2.5 px-3 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all cursor-pointer text-slate-700"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 font-bold text-xs transition-all whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-slate-200/50">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>{t('users.user')}</th>
                <th>{t('users.contact')}</th>
                <th>Telegram</th>
                <th>{t('users.role')}</th>
                <th className="text-right">{t('users.publicationPosts')}</th>
                <th>{t('common.status')}</th>
                <th>{t('users.joined')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 font-medium">
                    No users found
                  </td>
                </tr>
              ) : (data?.data ?? []).map((user, index) => (
                <tr
                  key={user.id}
                  className={`table-row-animate ${!user.isActive ? 'bg-red-50/50' : ''} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {/* User */}
                  <td className="!bg-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                        {(user.firstName?.[0] || user.phoneNumber[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm tracking-tight truncate">
                          {user.firstName || t('users.na')} {user.lastName || ''}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {user.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <p className="font-semibold text-slate-900 text-sm">{user.phoneNumber}</p>
                    {user.email && (
                      <p className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</p>
                    )}
                  </td>

                  {/* Telegram */}
                  <td>
                    {user.telegramChatId ? (
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {user.telegramChatId}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 font-medium">—</span>
                    )}
                  </td>

                  {/* Role */}
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => setRoleConfirm({ isOpen: true, user, newRole: e.target.value as 'USER' | 'ADMIN' })}
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-2 transition-all cursor-pointer ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  {/* Credits */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-bold text-slate-900 tabular-nums text-sm">
                        {(user.publicationCredits ?? 0).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddCreditsModal({ user, amount: '' })}
                        className="text-[10px] h-6 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0 font-black"
                      >
                        +
                      </Button>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive
                        ? <><Check className="w-3 h-3" /> {t('users.active')}</>
                        : <><Ban className="w-3 h-3" /> {t('users.blocked')}</>
                      }
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td>
                    <Button
                      size="sm"
                      onClick={() => setBlockConfirm({ isOpen: true, user })}
                      className={`h-8 px-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 flex items-center gap-1 shadow-sm ${
                        user.isActive
                          ? 'bg-rose-500 hover:bg-rose-600 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {user.isActive
                        ? <><Ban className="w-3 h-3" /> {t('users.block')}</>
                        : <><Check className="w-3 h-3" /> {t('users.unblock')}</>
                      }
                    </Button>
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
        onConfirm={() => {
          if (blockConfirm.user) {
            toggleActiveMutation.mutate({ id: blockConfirm.user.id, isActive: !blockConfirm.user.isActive });
          }
        }}
        title={blockConfirm.user?.isActive ? t('users.block') : t('users.unblock')}
        message={blockConfirm.user?.isActive ? t('users.confirmBlock') : t('users.confirmUnblock')}
        confirmText={blockConfirm.user?.isActive ? t('users.block') : t('users.unblock')}
        cancelText={t('common.cancel')}
        type={blockConfirm.user?.isActive ? 'danger' : 'info'}
        icon={blockConfirm.user?.isActive ? <Ban className="w-8 h-8 text-red-600" /> : <Check className="w-8 h-8 text-emerald-600" />}
      />

      <ConfirmDialog
        isOpen={roleConfirm.isOpen}
        onClose={() => setRoleConfirm({ isOpen: false, user: null, newRole: null })}
        onConfirm={() => {
          if (roleConfirm.user && roleConfirm.newRole) {
            updateRoleMutation.mutate({ id: roleConfirm.user.id, role: roleConfirm.newRole });
          }
        }}
        title="Change User Role"
        message={`Change ${roleConfirm.user?.firstName || roleConfirm.user?.phoneNumber}'s role to ${roleConfirm.newRole}?`}
        confirmText="Change Role"
        cancelText={t('common.cancel')}
        type="warning"
        icon={<Crown className="w-8 h-8 text-yellow-600" />}
      />

      {addCreditsModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
          onClick={() => setAddCreditsModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('users.addPosts')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {addCreditsModal.user.firstName || addCreditsModal.user.phoneNumber}{' '}
              — {t('users.publicationPosts')}: <strong>{(addCreditsModal.user.publicationCredits ?? 0).toLocaleString()}</strong>
            </p>
            <input
              type="number"
              min="1"
              step="1"
              placeholder={t('users.postsToAdd')}
              value={addCreditsModal.amount}
              onChange={(e) => setAddCreditsModal({ ...addCreditsModal, amount: e.target.value.replace(/\D/g, '').slice(0, 8) })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none mb-4 font-semibold"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddCreditsModal(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!addCreditsModal.amount || parseInt(addCreditsModal.amount, 10) < 1}
                onClick={() => {
                  const amount = parseInt(addCreditsModal.amount, 10);
                  if (amount >= 1) addCreditsMutation.mutate({ id: addCreditsModal.user.id, amount });
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
