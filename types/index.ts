export interface User {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  username: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  publicationCredits?: number;
  telegramChatId?: string | null;
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
  fileId?: string;
  url?: string;
  fileType?: string;
  order?: number;
  createdAt?: string;
}

export interface ProductCondition {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSize {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  title: string | Record<string, string> | null;
  slug: string;
  description: string | Record<string, string> | null;
  price: number;
  currency: string;
  categoryId: string;
  category?: Category;
  sellerId: string;
  seller?: User;
  images: ProductImage[];
  tags: string[];
  type: 'FRESH' | 'DRIED' | 'ARTIFICIAL' | 'OTHER';
  condition?: ProductCondition | null;
  size?: ProductSize | null;
  quantity: number;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  isFeatured: boolean;
  views: number;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  activeAuction?: { id: string };
  interestedBuyers?: InterestedBuyer[];
}

export interface InterestedBuyer {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  avatarUrl: string | null;
  conversationId: string;
  lastMessageAt: string;
  isOnline: boolean;
}

export type OrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
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
  amount: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress | Record<string, unknown>;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentSource = 'APP' | 'BOT';
export type AdminPaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
export type PaymentType = 'PUBLICATION' | 'TOP_UP' | 'GOODS_PUBLICATION';
export type PaymentGateway = 'PAYME' | 'CLICK';

export interface Payment {
  id: string;
  amount: number;
  method: string;
  gateway: PaymentGateway | null;
  status: AdminPaymentStatus;
  paymentType: PaymentType;
  quantity: number;
  source: PaymentSource;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    phoneNumber: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
}

export interface PaymentAnalytics {
  period: '7d' | '30d' | '90d' | 'all';
  source: PaymentSource | null;
  kpi: {
    totalRevenue: number;
    totalTransactions: number;
    completedTransactions: number;
    pendingCount: number;
    successRate: number;
    avgTicket: number;
    failedCount?: number;
    expiredCount?: number;
  };
  bySource: Array<{ source: PaymentSource; revenue: number; count: number }>;
  byType: Array<{ paymentType: PaymentType; revenue: number; count: number; avgTicket: number }>;
  byStatus?: Array<{ status: AdminPaymentStatus; revenue: number; count: number }>;
  byGateway?: Array<{ gateway: string; revenue: number; count: number; avgTicket: number }>;
  timeSeries: Array<{ date: string; revenue: number; count: number }>;
}

export interface ProductAnalytics {
  period: '7d' | '30d' | '90d' | 'all';
  kpi: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    draft: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  timeSeries: Array<{ date: string; count: number }>;
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
