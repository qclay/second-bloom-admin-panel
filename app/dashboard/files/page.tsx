'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/file.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';
import { Upload, File, Trash2 } from 'lucide-react';

export default function FilesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);

  const { data, isLoading } = useQuery({
    queryKey: ['files', page, limit],
    queryFn: () => fileService.getAll({ page, limit }),
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
      <div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('files.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{t('files.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('files.subtitle')}</p>
        </div>
        <label className="cursor-pointer shrink-0">
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 w-full sm:w-auto flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> {t('files.upload')}
          </Button>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </label>
      </div>

      <div className="w-full min-w-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 min-[1920px]:grid-cols-12 min-[2560px]:grid-cols-16 gap-3">
        {data?.data.map((file, index) => (
          <div
            key={file.id}
            className="group min-w-0 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200"
            style={{ animationDelay: `${index * 0.02}s` }}
          >
            <div className="relative aspect-square min-h-[120px] w-full overflow-hidden bg-gray-100">
              {file.fileType === 'IMAGE' ? (
                <Image
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                  fill
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[120px]">
                  <File className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[11px] font-semibold text-gray-900 truncate mb-1.5">
                {file.filename}
              </p>
              <Button
                size="sm"
                variant="destructive"
                className="w-full h-7 bg-red-500 hover:bg-red-600 text-[11px] button-animate py-0"
                onClick={() => setDeleteConfirm({ isOpen: true, fileId: file.id })}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {data?.meta?.pagination && (
        <div className="mt-4">
          <Pagination
            meta={data.meta.pagination}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, fileId: null })}
        onConfirm={() => {
          if (deleteConfirm.fileId) {
            deleteMutation.mutate(deleteConfirm.fileId);
          }
        }}
        title={t('common.delete') + ' ' + t('files.title').slice(0, -1)}
        message={t('files.confirmDelete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        icon={<Trash2 className="w-8 h-8 text-red-600" />}
      />
    </div>
  );
}
