'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { conditionService } from '@/services/condition.service';
import { sizeService } from '@/services/size.service';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Product } from '@/types';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '' as number | string,
    categoryId: '',
    conditionId: '',
    sizeId: '',
    quantity: '' as number | string,
    type: 'FRESH' as 'FRESH' | 'DRIED' | 'ARTIFICIAL' | 'OTHER',
    status: 'ACTIVE' as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK',
    createAuction: false,
    auctionStartPrice: '' as number | string,
    auctionDurationHours: 2 as number,
  });
  const [, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({}),
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

  const uploadMutation = useMutation({
    mutationFn: fileService.upload,
    onSuccess: (data) => {
      setUploadedImageIds(prev => [...prev, data.id]);
      toast.success('Image uploaded');
    },
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
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const convertedData = {
        ...data,
        price: typeof data.price === 'string' ? (data.price === '' ? undefined : Number(data.price)) : data.price,
        quantity: typeof data.quantity === 'string' ? (data.quantity === '' ? undefined : Number(data.quantity)) : data.quantity,
      };
      return productService.update(id, convertedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(files);
      setImagePreviews(files.map(f => URL.createObjectURL(f)));
      
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = typeof formData.price === 'string' ? (formData.price === '' ? 0 : Number(formData.price)) : formData.price;
    const auctionStartPriceValue = typeof formData.auctionStartPrice === 'string' ? (formData.auctionStartPrice === '' ? 0 : Number(formData.auctionStartPrice)) : formData.auctionStartPrice;

    const baseData: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      quantity: typeof formData.quantity === 'string' ? (formData.quantity === '' ? 1 : Number(formData.quantity)) : formData.quantity,
      type: formData.type,
      status: formData.status,
      imageIds: uploadedImageIds,
    };

    if (editingId) {
      const updateData = {
        ...baseData,
        price: priceValue,
        ...(formData.conditionId && { conditionId: formData.conditionId }),
        ...(formData.sizeId && { sizeId: formData.sizeId }),
      };
      updateMutation.mutate({ id: editingId, data: updateData });
    } else {
      const createData = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        conditionId: formData.conditionId,
        sizeId: formData.sizeId,
        quantity: typeof formData.quantity === 'string' ? (formData.quantity === '' ? 1 : Number(formData.quantity)) : formData.quantity,
        type: formData.type,
        status: formData.status,
        imageIds: uploadedImageIds,
        price: formData.createAuction ? (auctionStartPriceValue || priceValue) : priceValue,
        createAuction: formData.createAuction,
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
    const conditionId = typeof product.condition === 'object' && product.condition ? product.condition.id : '';
    const sizeId = product.size?.id ?? '';
    setFormData({
      title: product.title,
      description: product.description || '',
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
    });
    setImagePreviews(product.images.map(img => img.url || ''));
    setUploadedImageIds(product.images.map(img => img.fileId));
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
      status: 'ACTIVE',
      createAuction: false,
      auctionStartPrice: '',
      auctionDurationHours: 2,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setUploadedImageIds([]);
    setEditingId(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          + Add Product
        </Button>
      </div>

      {productsData?.data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <span className="text-5xl">📦</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Products Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Your marketplace is empty. Start by adding products that sellers can list. 
              Each product should have images, pricing, and category information.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              + Add First Product
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData?.data.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- dynamic API URL, lazy loading used
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 flex-1 line-clamp-1">
                  {product.title}
                </h3>
                <span className="text-xl font-bold text-blue-600 ml-2">
                  ${product.price}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description || 'No description'}
              </p>

              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  {product.seller?.firstName?.[0] || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    By {product.seller?.firstName || 'Seller'} {product.seller?.lastName || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  product.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : product.status === 'OUT_OF_STOCK'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status}
                </span>
                <span className="text-xs font-semibold text-gray-600">
                  📦 {product.quantity} in stock
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  ✏️ Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id })}
                  className="bg-red-500 hover:bg-red-600 button-animate"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={resetForm}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreviews.map((preview, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
                        <img
                          key={idx}
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          loading="lazy"
                          decoding="async"
                        />
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 font-semibold">Upload images</span>
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
                value={formData.title}
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
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                      <option key={c.id} value={c.id}>{c.name}</option>
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
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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

              {!editingId && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
                  isLoading={createMutation.isPending || updateMutation.isPending}
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
        onClose={() => setDeleteConfirm({ isOpen: false, productId: null })}
        onConfirm={() => {
          if (deleteConfirm.productId) {
            deleteMutation.mutate(deleteConfirm.productId);
          }
        }}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone and will remove the product from your marketplace."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}
