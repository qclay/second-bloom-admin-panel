import { apiClient, ApiResponse } from '@/lib/api-client';

export interface ConversationParticipant {
  id: string;
  phoneNumber: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface ConversationLastMessage {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  unreadCount: number;
  isArchived: boolean;
  isBlocked: boolean;
  lastMessageAt?: string | null;
  lastMessage?: ConversationLastMessage | null;
  createdAt: string;
  updatedAt: string;
  seller?: { id: string; firstName?: string | null; lastName?: string | null; phoneNumber: string; avatarUrl?: string | null } | null;
  buyer?: { id: string; firstName?: string | null; lastName?: string | null; phoneNumber: string; avatarUrl?: string | null } | null;
  pinnedProduct?: { id: string; slug: string; title: string; price: number; currency?: string; imageUrl?: string | null } | null;
  pinnedOrder?: { id: string; orderNumber: string; amount: number; status: string } | null;
}

export interface MessageSender {
  id: string;
  phoneNumber: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  replyToMessageId?: string | null;
  messageType: string;
  content: string;
  file?: { id: string; url: string; filename: string; mimeType: string; size: number } | null;
  deliveryStatus: string;
  isRead: boolean;
  readAt?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationQuery {
  page?: number;
  limit?: number;
  archived?: boolean;
}

export interface ConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  data: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatStatistics {
  totalConversations: number;
  unreadMessages: number;
  archivedConversations: number;
  totalMessages: number;
}

export const chatService = {
  async getConversations(query?: ConversationQuery): Promise<ConversationsResponse> {
    const response = await apiClient.get<ApiResponse<ConversationsResponse>>('/chat/conversations', {
      params: query ?? { limit: 50 },
    });
    const raw = response.data.data as ConversationsResponse | undefined;
    return {
      data: raw?.data ?? [],
      total: raw?.total ?? 0,
      page: raw?.page ?? 1,
      limit: raw?.limit ?? 20,
    };
  },

  async getConversationById(id: string): Promise<Conversation> {
    const response = await apiClient.get<ApiResponse<Conversation>>(`/chat/conversations/${id}`);
    return response.data.data;
  },

  async getMessages(conversationId: string, params?: { limit?: number; cursor?: string }): Promise<MessagesResponse> {
    const response = await apiClient.get<ApiResponse<MessagesResponse>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: params ?? { limit: 50 } }
    );
    const raw = response.data.data as MessagesResponse | undefined;
    return {
      data: raw?.data ?? [],
      hasMore: raw?.hasMore ?? false,
      nextCursor: raw?.nextCursor,
    };
  },

  async getStatistics(): Promise<ChatStatistics> {
    const response = await apiClient.get<ApiResponse<ChatStatistics>>('/chat/statistics');
    return response.data.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/messages/${messageId}`);
  },
};
