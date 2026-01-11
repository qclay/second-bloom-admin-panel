'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileService.getAll({}),
  });

  const uploadMutation = useMutation({
    mutationFn: fileService.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded');
      setUploading(false);
    },
    onError: () => {
      toast.error('Upload failed');
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: fileService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-1">Manage uploaded files</p>
        </div>
        <label className="cursor-pointer">
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
            📤 Upload File
          </Button>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data?.data.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {file.fileType === 'IMAGE' ? (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">📄</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-900 truncate mb-2">
                {file.filename}
              </p>
              <Button
                size="sm"
                variant="destructive"
                className="w-full bg-red-500 hover:bg-red-600 text-xs button-animate"
                onClick={() => setDeleteConfirm({ isOpen: true, fileId: file.id })}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, fileId: null })}
        onConfirm={() => {
          if (deleteConfirm.fileId) {
            deleteMutation.mutate(deleteConfirm.fileId);
          }
        }}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}
