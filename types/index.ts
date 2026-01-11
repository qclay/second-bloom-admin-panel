export interface User {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileResponse {
  id: string;
  url: string;
  key: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';
  entityType: string | null;
  entityId: string | null;
  uploadedById: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: FileResponse | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  fileId: string;
  order: number;
  createdAt: string;
  url?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  categoryId: string;
  category: Category;
  sellerId: string;
  seller: User;
  images: ProductImage[];
  tags: string[];
  type: 'FRESH' | 'DRIED' | 'ARTIFICIAL' | 'OTHER';
  condition: 'NEW' | 'USED' | 'REFURBISHED' | null;
  quantity: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  isFeatured: boolean;
  views: number;
  region: string | null;
  city: string | null;
  district: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  postalCode?: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyer: User;
  sellerId: string;
  seller: User;
  productId: string;
  product: Product;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress | Record<string, unknown>;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}
