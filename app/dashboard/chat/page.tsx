'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, type Conversation, type ChatMessage } from '@/services/chat.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function participantLabel(c: Conversation): string {
  const others = c.participants?.filter((p) => p.id) ?? [];
  if (c.buyer?.firstName || c.buyer?.lastName) {
    return [c.buyer.firstName, c.buyer.lastName].filter(Boolean).join(' ') || c.buyer.phoneNumber;
  }
  if (c.seller?.firstName || c.seller?.lastName) {
    return [c.seller.firstName, c.seller.lastName].filter(Boolean).join(' ') || c.seller.phoneNumber;
  }
  if (others.length > 0) {
    const o = others[0];
    return [o.firstName, o.lastName].filter(Boolean).join(' ') || o.phoneNumber || 'User';
  }
  return 'Conversation';
}

function senderLabel(m: ChatMessage): string {
  const s = m.sender;
  if (!s) return '—';
  const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
  return name || s.phoneNumber || '—';
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['chat-statistics'],
    queryFn: () => chatService.getStatistics(),
  });

  const { data: conversationsData, isLoading: loadingList } = useQuery({
    queryKey: ['chat-conversations', archived],
    queryFn: () => chatService.getConversations({ limit: 50, archived: archived || undefined }),
  });

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', selectedId],
    queryFn: () => chatService.getMessages(selectedId!, { limit: 100 }),
    enabled: !!selectedId,
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: () => {
      if (selectedId) queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-statistics'] });
      toast.success('Message deleted');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete message');
    },
  });

  const conversations = conversationsData?.data ?? [];
  const messages = messagesData?.data ?? [];
  const selectedConversation = selectedId
    ? conversations.find((c) => c.id === selectedId)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          View your conversations. Only conversations you participate in are shown.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Conversations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Archived</p>
            <p className="text-2xl font-bold text-gray-700">{stats.archivedConversations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total messages</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        selectedId === c.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {participantLabel(c)}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-blue-500 text-white text-xs px-2 py-0.5">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {c.lastMessage?.content ?? 'No messages'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.lastMessageAt ? formatDate(c.lastMessageAt) : ''}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation ? participantLabel(selectedConversation) : 'Messages'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
                {loadingMessages ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages in this conversation.</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-3 max-w-[85%] ${
                        m.isDeleted
                          ? 'bg-gray-100 text-gray-400 italic'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {senderLabel(m)}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                      </div>
                      {m.isDeleted ? (
                        <p className="text-sm">Message deleted</p>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                          <div className="mt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                              onClick={() => {
                                if (confirm('Delete this message?')) {
                                  deleteMessageMutation.mutate(m.id);
                                }
                              }}
                              disabled={deleteMessageMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
