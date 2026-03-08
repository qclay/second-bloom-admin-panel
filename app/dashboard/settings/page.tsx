'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';

export default function SettingsPage() {
  const t = useTranslations();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const updateMutation = useMutation({
    mutationFn: () => userService.update(user!.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully!');
      useAuthStore.getState().setAuth(
        { ...user!, ...formData },
        useAuthStore.getState().accessToken!,
        useAuthStore.getState().refreshToken!
      );
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profileInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('settings.phoneNumber')}
                value={user?.phoneNumber || ''}
                disabled
                className="bg-gray-50"
              />
              
              <Input
                label={t('settings.firstName')}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t('settings.placeholderFirstName')}
              />
              <Input
                label={t('settings.lastName')}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('settings.placeholderLastName')}
              />
              <Input
                label={t('settings.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                isLoading={updateMutation.isPending}
              >
                {updateMutation.isPending ? t('common.saving') : t('settings.saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.accountInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-600">{t('users.role')}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{user?.role}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                user?.role === 'ADMIN' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user?.role}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-600">{t('settings.accountStatus')}</p>
                <p className="text-base font-bold text-green-600 mt-1">{t('users.active')}</p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700">
                ✓ Active
              </span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-600">User ID</p>
                <p className="text-xs font-mono text-gray-500 mt-1">{user?.id}</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-bold text-gray-600">Member Since</p>
                <p className="text-base font-bold text-gray-900 mt-1">Jan 6, 2026</p>
              </div>
              <span className="text-2xl">🎉</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
