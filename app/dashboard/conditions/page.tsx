'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conditionService, type Condition, type UpdateConditionDto } from '@/services/condition.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';
import { useIsReadOnly } from '@/hooks/useIsReadOnly';
import { ClipboardList, Trash2 } from 'lucide-react';

function toStringName(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const s = obj.en ?? obj.uz ?? obj.ru ?? Object.values(obj)[0];
    return typeof s === 'string' ? s : '';
  }
  return String(value) === '[object Object]' ? '' : String(value);
}

export default function ConditionsPage() {
  const t = useTranslations();
  const isReadOnly = useIsReadOnly();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; conditionId: string | null }>({
    isOpen: false,
    conditionId: null,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['conditions', page, limit],
    queryFn: () => conditionService.getAll({ page, limit }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: { en: string } }) => conditionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Condition created');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConditionDto }) =>
      conditionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Condition updated');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: conditionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Condition deleted');
      setDeleteConfirm({ isOpen: false, conditionId: null });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = name.trim();
    if (!nameStr) {
      toast.error('Name is required');
      return;
    }
    const payload = { name: { en: nameStr } };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (condition: Condition) => {
    setEditingId(condition.id);
    setName(toStringName(condition.name));
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
        <p className="mt-4 text-gray-600">{t('conditions.loading')}</p>
      </div>
    );
  }

  const conditions = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{t('conditions.title')}</h1>
          <p className="text-sm text-gray-600 mt-0.5">{t('conditions.subtitle')}</p>
        </div>
        {!isReadOnly && (
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shrink-0"
          >
            {t('conditions.add')}
          </Button>
        )}
      </div>

      {conditions.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-amber-50 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t('conditions.noConditions')}</h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Add conditions so products can be labeled (e.g. Like New, Good condition). Used in product forms.
            </p>
            {!isReadOnly && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                {t('conditions.add')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className="group min-w-0 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all duration-200"
            >
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 truncate mb-1">
                  {toStringName(condition.name)}
                </h3>
                <p className="text-xs text-gray-500 font-mono truncate mb-3">{condition.slug}</p>
                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(condition)}
                      className="flex-1 h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirm({ isOpen: true, conditionId: condition.id })}
                      className="h-8 px-2 min-w-0 bg-red-500 hover:bg-red-600 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {data?.meta?.pagination ? (
          <div className="mt-4">
            <Pagination
              meta={data.meta.pagination}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        ) : null}
      </>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={resetForm}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto mx-3 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? t('common.edit') : t('conditions.add')}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label={t('common.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Like New, Good condition"
                required
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? t('common.save') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, conditionId: null })}
        onConfirm={() => {
          if (deleteConfirm.conditionId) deleteMutation.mutate(deleteConfirm.conditionId);
        }}
        title={t('common.delete') + ' ' + t('common.condition')}
        message={t('conditions.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        icon={<Trash2 className="w-8 h-8 text-red-600" />}
      />
    </div>
  );
}
