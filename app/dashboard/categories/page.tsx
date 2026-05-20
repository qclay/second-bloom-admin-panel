'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, UpdateCategoryDto } from '@/services/category.service';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Category } from '@/types';
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

function getFileIdFromResponse(data: unknown): string {
  if (data == null || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  const id = d.id ?? d.fileId ?? d._id;
  if (typeof id === 'string') return id;
  const file = d.file as Record<string, unknown> | undefined;
  if (file && typeof file === 'object') {
    const fid = file.id ?? file.fileId ?? file._id;
    if (typeof fid === 'string') return fid;
  }
  const inner = d.data as Record<string, unknown> | undefined;
  if (inner && typeof inner === 'object') {
    const fid = inner.id ?? inner.fileId ?? inner._id;
    if (typeof fid === 'string') return fid;
  }
  return '';
}

export default function CategoriesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageId: '',
    isActive: true,
  });
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; categoryId: string | null }>({
    isOpen: false,
    categoryId: null,
  });
  const imageIdRef = useRef<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, limit],
    queryFn: () => categoryService.getAll({ includeChildren: true, page, limit }),
  });

  const uploadMutation = useMutation({
    mutationFn: fileService.upload,
    onSuccess: (data) => {
      const id = getFileIdFromResponse(data);
      if (id) {
        imageIdRef.current = id;
        setFormData(prev => ({ ...prev, imageId: id }));
      }
      const url = (data as { url?: string }).url;
      setImagePreview(typeof url === 'string' ? url : '');
      toast.success('Image uploaded');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    },
  });

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    try {
      const result = await uploadMutation.mutateAsync(file);
      const id = getFileIdFromResponse(result);
      if (id) {
        imageIdRef.current = id;
        setFormData(prev => ({ ...prev, imageId: id }));
      }
    } catch {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMutation.isPending) return;
    let imageId = formData.imageId || imageIdRef.current;
    if (editingId && !imageId && data?.data) {
      const cat = data.data.find((c) => c.id === editingId) as { image?: { id?: string; fileId?: string }; imageId?: string } | undefined;
      if (cat) imageId = cat.image?.id ?? cat.image?.fileId ?? cat.imageId ?? '';
    }
    const imageIdFinal = imageId?.trim() || null;
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          name: { en: formData.name },
          description: formData.description ? { en: formData.description } : undefined,
          isActive: formData.isActive,
          imageId: imageIdFinal,
        },
      });
    } else {
      createMutation.mutate({
        name: { en: formData.name },
        description: formData.description ? { en: formData.description } : undefined,
        isActive: formData.isActive,
        ...(imageIdFinal && { imageId: imageIdFinal }),
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    const img = category.image as { id?: string; fileId?: string; url?: string } | null | undefined;
    const cat = category as { imageId?: string };
    const imageId = (img?.id ?? img?.fileId ?? cat?.imageId ?? '') as string;
    imageIdRef.current = imageId;
    setFormData({
      name: toStringValue(category.name),
      description: toStringValue(category.description),
      imageId,
      isActive: category.isActive,
    });
    setImagePreview(img?.url ?? null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    imageIdRef.current = '';
    setFormData({ name: '', description: '', imageId: '', isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('categories.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">{t('categories.title')}</h1>
          <p className="text-slate-500 font-medium">{t('categories.subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="btn-premium px-8 py-6 rounded-2xl font-black text-sm uppercase tracking-widest"
        >
          {t('categories.addCategory')}
        </Button>
      </div>

      {data?.data.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl">📁</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              {t('categories.noCategories')}
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Start organizing your marketplace by creating product categories. 
              Categories help buyers find what they&apos;re looking for.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              + Create First Category
            </Button>
          </div>
        </div>
      ) : (
        <>
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {data?.data.map((category, index) => (
          <div
            key={category.id}
            className="glass-card group/card rounded-3xl overflow-hidden border border-slate-200/50"
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            <button
              type="button"
              onClick={() => handleEdit(category)}
              className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-t-lg overflow-hidden bg-gray-100"
            >
              <div className="relative aspect-square min-h-[140px] w-full overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image.url}
                    alt={toStringValue(category.name)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                    fill
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📁</span>
                  </div>
                )}
              </div>
            </button>

            <div className="p-2">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <h3 className="text-sm font-black text-slate-900 truncate flex-1 min-w-0 tracking-tight">
                  {toStringValue(category.name)}
                </h3>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  category.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {category.isActive ? 'On' : 'Off'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 min-h-[1.75rem]">
                {toStringValue(category.description) || 'No description'}
              </p>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="flex-1 h-7 text-[11px] button-animate border-emerald-200 text-emerald-700 hover:bg-emerald-50 py-0"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ isOpen: true, categoryId: category.id });
                  }}
                  className="h-7 px-1.5 min-w-0 button-animate bg-red-500 hover:bg-red-600 text-xs py-0"
                >
                  🗑️
                </Button>
              </div>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 modal-backdrop overflow-y-auto"
          onClick={resetForm}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-content my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingId ? t('common.edit') + ' ' + t('common.category') : t('categories.addCategory')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                        loading="lazy"
                        width={400}
                        height={300}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageId: '' }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <label className="cursor-pointer">
                        <span className="text-purple-600 font-semibold">Upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <Input
                label="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dried Flowers"
                required
                className="mb-4"
              />

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Long-lasting bouquets made of preserved flora"
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active Category
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={uploadMutation.isPending}
                  isLoading={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
                >
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, categoryId: null })}
        onConfirm={() => {
          if (deleteConfirm.categoryId) {
            deleteMutation.mutate(deleteConfirm.categoryId);
          }
        }}
        title={t('common.delete') + ' ' + t('common.category')}
        message={t('categories.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}
