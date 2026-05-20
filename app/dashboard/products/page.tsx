'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, UpdateProductDto } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { conditionService } from '@/services/condition.service';
import { sizeService } from '@/services/size.service';
import { locationService } from '@/services/location.service';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Product } from '@/types';
import { useTranslations } from '@/lib/translations';
import { Package, Check, X as XIcon, Trash2, Camera } from 'lucide-react';

function toStringValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ('en' in obj || 'uz' in obj || 'ru' in obj) {
      const s = obj.en ?? obj.uz ?? obj.ru;
      if (typeof s === 'string' && s.trim()) return s;
    }
    const firstString = Object.values(obj).find(v => typeof v === 'string' && String(v).trim());
    if (firstString) return String(firstString);
  }
  const str = String(value);
  return str === '[object Object]' ? '' : str;
}

export default function ProductsPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProductHasActiveAuction, setEditingProductHasActiveAuction] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '' as number | string,
    categoryId: '',
    conditionId: '',
    sizeId: '',
    quantity: '' as number | string,
    type: 'FRESH' as 'FRESH' | 'DRIED' | 'ARTIFICIAL' | 'OTHER',
    status: 'PUBLISHED' as 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED',
    createAuction: false,
    auctionStartPrice: '' as number | string,
    auctionDurationHours: 2 as number,
    regionId: '',
    cityId: '',
    districtId: '',
  });
  const [, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [moderationConfirm, setModerationConfirm] = useState<{ isOpen: boolean; productId: string | null; action: 'approve' | 'reject'; rejectionReason?: string } | null>(null);
  const imageIdsRef = useRef<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const effectiveFilter = searchParams.get('moderation') === '1' ? 'PENDING' : statusFilter;
  const isPendingFilter = effectiveFilter === 'PENDING';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', effectiveFilter, page, limit],
    queryFn: () =>
      productService.getAll(
        effectiveFilter ? { status: effectiveFilter, page, limit } : { page, limit }
      ),
  });

  const { data: pendingCountData } = useQuery({
    queryKey: ['products', 'pending-count'],
    queryFn: () => productService.getAll({ status: 'PENDING', page: 1, limit: 1 }),
    enabled: effectiveFilter !== 'PENDING',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll({}),
  });

  const { data: conditionsData } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => conditionService.getAll({}),
  });

  const { data: sizesData } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => sizeService.getAll({}),
  });

  const { data: regionsData } = useQuery({
    queryKey: ['locations-regions'],
    queryFn: () => locationService.getRegions(),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['locations-cities', formData.regionId],
    queryFn: () => locationService.getCities(formData.regionId || undefined),
    enabled: !!formData.regionId,
  });

  const { data: districtsData } = useQuery({
    queryKey: ['locations-districts', formData.cityId],
    queryFn: () => locationService.getDistricts(formData.cityId || undefined),
    enabled: !!formData.cityId,
  });

  const uploadMutation = useMutation({
    mutationFn: fileService.upload,
  });

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(variables.createAuction ? 'Product and auction created' : 'Product created');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductDto & { price?: number; quantity?: number; imageIds?: string[] };
    }) => {
      const imageIds = Array.isArray(data.imageIds) ? data.imageIds.filter((id): id is string => typeof id === 'string' && id.length > 0) : [];
      const convertedData: UpdateProductDto = {
        ...data,
        price: typeof data.price === 'string' ? (data.price === '' ? undefined : Number(data.price)) : data.price,
        quantity: typeof data.quantity === 'string' ? (data.quantity === '' ? undefined : Number(data.quantity)) : data.quantity,
        imageIds,
      };
      return productService.update(id, convertedData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      const hadCreateAuction = variables.data && 'createAuction' in variables.data && variables.data.createAuction;
      toast.success(hadCreateAuction ? 'Product updated and auction created' : 'Product updated');
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });

  const moderationMutation = useMutation({
    mutationFn: ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) =>
      productService.moderate(id, { action, rejectionReason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(variables.action === 'approve' ? 'Product approved' : 'Product rejected');
      setModerationConfirm(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to moderate');
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    setImageFiles(prev => [...(prev || []), ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    const prevLen = imagePreviews.length;
    setImagePreviews(prev => [...prev, ...newPreviews]);
    const newIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const data = await uploadMutation.mutateAsync(files[i]);
        const id = (data as { id?: string; fileId?: string }).id ?? (data as { id?: string; fileId?: string }).fileId;
        if (id) newIds.push(id);
      } catch {
        newPreviews.forEach(p => URL.revokeObjectURL(p));
        setImagePreviews(prev => prev.slice(0, prevLen));
        toast.error('Image upload failed');
        return;
      }
    }
    setUploadedImageIds(prev => {
      const nextIds = [...prev, ...newIds];
      imageIdsRef.current = nextIds;
      return nextIds;
    });
    if (newIds.length > 0) toast.success(newIds.length === 1 ? 'Image uploaded' : `${newIds.length} images uploaded`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMutation.isPending) return;
    const priceValue = typeof formData.price === 'string' ? (formData.price === '' ? 0 : Number(formData.price)) : formData.price;
    const auctionStartPriceValue = typeof formData.auctionStartPrice === 'string' ? (formData.auctionStartPrice === '' ? 0 : Number(formData.auctionStartPrice)) : formData.auctionStartPrice;

    const titleStr = typeof formData.title === 'string' ? formData.title : toStringValue(formData.title);
    const descriptionStr = typeof formData.description === 'string' ? formData.description : toStringValue(formData.description);
    const titleI18n = { en: titleStr };
    const descriptionI18n = descriptionStr ? { en: descriptionStr } : undefined;

    const imageIdsSource = (uploadedImageIds?.length ? uploadedImageIds : imageIdsRef.current) ?? [];
    const imageIdsClean = imageIdsSource.filter((id): id is string => typeof id === 'string' && id.length > 0);

    const baseData: Record<string, unknown> = {
      title: titleI18n,
      description: descriptionI18n,
      categoryId: formData.categoryId,
      quantity: typeof formData.quantity === 'string' ? (formData.quantity === '' ? 1 : Number(formData.quantity)) : formData.quantity,
      type: formData.type,
      status: formData.status,
      imageIds: imageIdsClean,
      ...(formData.regionId && { regionId: formData.regionId }),
      ...(formData.cityId && { cityId: formData.cityId }),
      ...(formData.districtId && { districtId: formData.districtId }),
    };

    if (editingId) {
      const updateData = {
        ...baseData,
        price: priceValue,
        imageIds: imageIdsClean,
        ...(formData.conditionId && { conditionId: formData.conditionId }),
        ...(formData.sizeId && { sizeId: formData.sizeId }),
        ...(formData.createAuction &&
          !editingProductHasActiveAuction && {
            createAuction: true,
            auction: {
              startPrice:
                typeof formData.auctionStartPrice === 'string'
                  ? (formData.auctionStartPrice === '' ? priceValue : Number(formData.auctionStartPrice))
                  : (formData.auctionStartPrice || priceValue),
              durationHours: formData.auctionDurationHours,
            },
          }),
      };
      updateMutation.mutate({ id: editingId, data: updateData });
    } else {
      const createData = {
        title: titleI18n,
        description: descriptionI18n,
        categoryId: formData.categoryId,
        conditionId: formData.conditionId,
        sizeId: formData.sizeId,
        quantity: typeof formData.quantity === 'string' ? (formData.quantity === '' ? 1 : Number(formData.quantity)) : formData.quantity,
        type: formData.type,
        status: formData.status,
        imageIds: imageIdsClean,
        price: formData.createAuction ? (auctionStartPriceValue || priceValue) : priceValue,
        createAuction: formData.createAuction,
        ...(formData.regionId && { regionId: formData.regionId }),
        ...(formData.cityId && { cityId: formData.cityId }),
        ...(formData.districtId && { districtId: formData.districtId }),
        ...(formData.createAuction && {
          auction: {
            startPrice: auctionStartPriceValue || priceValue,
            durationHours: formData.auctionDurationHours,
          },
        }),
      };
      createMutation.mutate(createData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditingProductHasActiveAuction(!!product.activeAuction?.id);
    const conditionId = typeof product.condition === 'object' && product.condition ? product.condition.id : '';
    const sizeId = product.size?.id ?? '';
    setFormData({
      title: toStringValue(product.title),
      description: toStringValue(product.description),
      price: product.price.toString(),
      categoryId: product.categoryId,
      conditionId,
      sizeId,
      quantity: product.quantity.toString(),
      type: product.type,
      status: product.status,
      createAuction: false,
      auctionStartPrice: '',
      auctionDurationHours: 2,
      regionId: '',
      cityId: '',
      districtId: '',
    });
    const imageList = Array.isArray(product.images) ? product.images : [];
    const previews = imageList.map((img: { url?: string }) => img?.url ?? '');
    const ids = imageList
      .map((img: { id?: string; fileId?: string }) => img?.id ?? img?.fileId ?? '')
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    imageIdsRef.current = ids;
    setImagePreviews(previews);
    setUploadedImageIds(ids);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      categoryId: '',
      conditionId: '',
      sizeId: '',
      quantity: '',
      type: 'FRESH',
      status: 'PUBLISHED',
      createAuction: false,
      auctionStartPrice: '',
      auctionDurationHours: 2,
      regionId: '',
      cityId: '',
      districtId: '',
    });
    setImageFiles([]);
    setImagePreviews(prev => {
      prev.forEach(p => { if (typeof p === 'string' && p.startsWith('blob:')) URL.revokeObjectURL(p); });
      return [];
    });
    imageIdsRef.current = [];
    setUploadedImageIds([]);
    setEditingId(null);
    setEditingProductHasActiveAuction(false);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('products.loadingProducts')}</p>
        </div>
      </div>
    );
  }

  const allProducts = productsData?.data ?? [];
  const displayProducts = isPendingFilter ? allProducts : allProducts;
  const pendingCount = isPendingFilter
    ? (productsData?.data?.length ?? 0)
    : (pendingCountData?.meta?.pagination?.total ?? 0);

  const setFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    if (value === 'PENDING') router.replace('/dashboard/products?moderation=1');
    else router.replace('/dashboard/products');
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">{t('products.title')}</h1>
          <p className="text-slate-500 font-medium">{t('products.subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="btn-premium px-8 py-6 rounded-2xl font-black text-sm uppercase tracking-widest"
        >
          {t('products.addProduct')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {[
          { value: '', label: t('products.all') },
          { value: 'PENDING', label: t('products.pendingApproval') },
          { value: 'PUBLISHED', label: t('products.active') },
          { value: 'DRAFT', label: t('products.draft') },
          { value: 'REJECTED', label: t('products.rejected') },
        ].map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              effectiveFilter === value
                ? 'bg-slate-900 text-white shadow-xl scale-105'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {label}
            {value === 'PENDING' && pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {displayProducts.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16 animate-fade-in">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center animate-float">
              <Package className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              {effectiveFilter ? t('products.noMatchFilter') : t('products.noProductsYet')}
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {effectiveFilter ? t('products.tryAnotherFilter') : t('products.emptyHint')}
            </p>
            {!effectiveFilter && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {t('products.addFirst')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {displayProducts.map((product, index) => (
          <div
            key={product.id}
            className="glass-card group/card rounded-3xl overflow-hidden border border-slate-200/50"
            style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
          >
            <div className="relative aspect-square min-h-[140px] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {product.images?.[0]?.url ? (
                <Image
                  src={product.images[0].url}
                  alt={toStringValue(product.title)}
                  className="w-full h-full object-cover object-center group-hover/card:scale-110 transition-transform duration-300 ease-out"
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  fill
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[140px] group-hover/card:scale-105 transition-transform duration-300">
                  <Package className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="p-2">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-gray-900 truncate flex-1 min-w-0 line-clamp-1">
                  {toStringValue(product.title)}
                </h3>
                <span className="text-sm font-bold text-blue-600 shrink-0">
                  ${product.price}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 min-h-[1.75rem]">
                {toStringValue(product.description) || t('products.noDescription')}
              </p>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {product.seller?.firstName?.[0] || 'S'}
                </div>
                <p className="text-[10px] text-gray-500 truncate min-w-0 flex-1">
                  {product.seller?.firstName ?? t('products.seller')} {product.seller?.lastName ?? ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  product.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700'
                    : product.status === 'PENDING' || product.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-700'
                    : product.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status === 'PENDING'
                    ? t('products.pending')
                    : product.status === 'PUBLISHED'
                    ? t('products.active')
                    : product.status === 'DRAFT'
                    ? t('products.draft')
                    : product.status === 'REJECTED'
                    ? t('products.rejected')
                    : product.status}
                </span>
                <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                  <Package className="w-3 h-3" /> {product.quantity}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(product.status === 'PENDING' || product.status === 'DRAFT') && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setModerationConfirm({ isOpen: true, productId: product.id, action: 'approve' })}
                      className="h-7 text-[11px] transition-transform duration-150 active:scale-95 bg-green-600 hover:bg-green-700 hover:shadow-md text-white py-0 flex-1 min-w-0 flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" /> {t('products.approve')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModerationConfirm({ isOpen: true, productId: product.id, action: 'reject', rejectionReason: '' })}
                      className="h-7 text-[11px] transition-transform duration-150 active:scale-95 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 py-0 flex-1 min-w-0 flex items-center justify-center gap-1"
                    >
                      <XIcon className="w-3 h-3" /> {t('products.reject')}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="h-7 text-[11px] transition-transform duration-150 active:scale-95 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 py-0 flex-1 min-w-0"
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id })}
                  className="h-7 px-1.5 min-w-0 transition-transform duration-150 active:scale-95 bg-red-500 hover:bg-red-600 hover:shadow-md flex items-center justify-center py-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          ))}
        </div>
        {productsData?.meta?.pagination ? (
          <div className="mt-4">
            <Pagination
              meta={productsData.meta.pagination}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in overflow-y-auto"
          onClick={resetForm}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {imagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <Image
                              src={preview}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                              loading="lazy"
                              width={200}
                              height={128}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
                                setImagePreviews(p => p.filter((_, i) => i !== idx));
                                setUploadedImageIds(ids => {
                                  const next = ids.filter((_, i) => i !== idx);
                                  imageIdsRef.current = next;
                                  return next;
                                });
                              }}
                              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold opacity-90 hover:opacity-100 shadow"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-blue-600 font-semibold hover:underline">
                        <span>Add more images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-center mb-2"><Camera className="w-10 h-10 text-gray-400" /></div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 font-semibold">Upload images (multiple)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <Input
                label="Product Name"
                value={typeof formData.title === 'string' ? formData.title : toStringValue(formData.title)}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categoriesData?.data.map((cat) => (
                    <option key={cat.id} value={cat.id}>{toStringValue(cat.name)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Condition</label>
                  <select
                    value={formData.conditionId}
                    onChange={(e) => setFormData({ ...formData, conditionId: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                    required
                  >
                    <option value="">Select condition</option>
                    {(Array.isArray(conditionsData?.data) ? conditionsData.data : []).map((c) => (
                      <option key={c.id} value={c.id}>{toStringValue(c.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Size</label>
                  <select
                    value={formData.sizeId}
                    onChange={(e) => setFormData({ ...formData, sizeId: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                    required
                  >
                    <option value="">Select size</option>
                    {(Array.isArray(sizesData?.data) ? sizesData.data : []).map((s) => (
                      <option key={s.id} value={s.id}>{toStringValue(s.name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="block text-sm font-bold text-gray-700 mb-2">Location (optional)</p>
                <p className="text-xs text-gray-500 mb-3">Choose region, then city, then district. Used for both new and existing products.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                    <select
                      value={formData.regionId}
                      onChange={(e) => setFormData({ ...formData, regionId: e.target.value, cityId: '', districtId: '' })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                    >
                      <option value="">Select region</option>
                      {(regionsData ?? []).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <select
                      value={formData.cityId}
                      onChange={(e) => setFormData({ ...formData, cityId: e.target.value, districtId: '' })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!formData.regionId}
                    >
                      <option value="">Select city</option>
                      {(citiesData ?? []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                    <select
                      value={formData.districtId}
                      onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!formData.cityId}
                    >
                      <option value="">Select district</option>
                      {(districtsData ?? []).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={formData.createAuction ? 'Price / Start Price ($)' : 'Price ($)'}
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : e.target.value })}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {editingId && editingProductHasActiveAuction ? (
                  <p className="text-sm text-amber-700 font-medium">
                    This product already has an active auction. You cannot create another until it ends.
                  </p>
                ) : (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.createAuction}
                        onChange={(e) => setFormData({ ...formData, createAuction: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-gray-700">Create auction for this product</span>
                    </label>
                    {formData.createAuction && (
                      <div className="grid grid-cols-2 gap-4 pl-7">
                        <Input
                          label="Auction start price ($)"
                          type="number"
                          value={formData.auctionStartPrice !== '' ? formData.auctionStartPrice : formData.price}
                          onChange={(e) => setFormData({ ...formData, auctionStartPrice: e.target.value === '' ? '' : e.target.value })}
                          placeholder="Uses price above if empty"
                          min="0"
                          step="0.01"
                        />
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Duration (hours)</label>
                          <select
                            value={formData.auctionDurationHours}
                            onChange={(e) => setFormData({ ...formData, auctionDurationHours: Number(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                          >
                            {[2, 6, 12, 24, 48, 72, 168].map((h) => (
                              <option key={h} value={h}>{h} hours</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={typeof formData.description === 'string' ? formData.description : toStringValue(formData.description)}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                />
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
                  disabled={uploadMutation.isPending}
                  isLoading={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
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
        onClose={() => setDeleteConfirm({ isOpen: false, productId: null })}
        onConfirm={() => {
          if (deleteConfirm.productId) {
            deleteMutation.mutate(deleteConfirm.productId);
          }
        }}
        title={t('common.delete') + ' ' + t('common.product')}
        message={t('products.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        icon={<Trash2 className="w-8 h-8 text-red-600" />}
      />

      {moderationConfirm && (
        <ConfirmDialog
          isOpen={moderationConfirm.isOpen}
          onClose={() => setModerationConfirm(null)}
          onConfirm={() => {
            if (moderationConfirm.productId) {
              moderationMutation.mutate({
                id: moderationConfirm.productId,
                action: moderationConfirm.action,
                rejectionReason: moderationConfirm.action === 'reject' ? (moderationConfirm.rejectionReason?.trim() ?? '') : undefined,
              });
            }
          }}
          title={moderationConfirm.action === 'approve' ? t('products.approveProduct') : t('products.rejectProduct')}
          message={moderationConfirm.action === 'approve' ? t('products.approveConfirm') : t('products.rejectConfirm')}
          confirmText={moderationConfirm.action === 'approve' ? t('products.approve') : t('products.reject')}
          cancelText={t('common.cancel')}
          type={moderationConfirm.action === 'approve' ? 'info' : 'danger'}
          icon={moderationConfirm.action === 'approve' ? <Check className="w-8 h-8 text-green-600" /> : <XIcon className="w-8 h-8 text-red-600" />}
          closeOnConfirm={false}
          isLoading={moderationMutation.isPending}
          confirmDisabled={moderationConfirm.action === 'reject' && !(moderationConfirm.rejectionReason?.trim())}
          extraContent={moderationConfirm.action === 'reject' ? (
            <label className="block text-left">
              <span className="block text-sm font-semibold text-gray-700 mb-1">{t('products.rejectionReason')}</span>
              <textarea
                value={moderationConfirm.rejectionReason ?? ''}
                onChange={(e) => setModerationConfirm(prev => prev ? { ...prev, rejectionReason: e.target.value } : null)}
                placeholder={t('products.rejectionReasonPlaceholder')}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 min-h-[80px]"
                rows={3}
              />
            </label>
          ) : undefined}
        />
      )}
    </div>
  );
}
