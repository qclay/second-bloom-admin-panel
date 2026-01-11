'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { User as UserType } from '@/types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [blockConfirm, setBlockConfirm] = useState<{ isOpen: boolean; user: UserType | null }>({
    isOpen: false,
    user: null,
  });
  const [roleConfirm, setRoleConfirm] = useState<{ isOpen: boolean; user: UserType | null; newRole: 'USER' | 'ADMIN' | null }>({
    isOpen: false,
    user: null,
    newRole: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: () => userService.getAll({ search: searchTerm }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.update(id, { isActive }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.isActive ? 'User unblocked successfully' : 'User blocked successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update user status');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      userService.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    },
  });

  const handleToggleBlock = (user: UserType) => {
    setBlockConfirm({ isOpen: true, user });
  };

  const handleRoleChange = (user: UserType, newRole: 'USER' | 'ADMIN') => {
    setRoleConfirm({ isOpen: true, user, newRole });
  };

  const confirmBlock = () => {
    if (blockConfirm.user) {
      toggleActiveMutation.mutate({ 
        id: blockConfirm.user.id, 
        isActive: !blockConfirm.user.isActive 
      });
    }
  };

  const confirmRoleChange = () => {
    if (roleConfirm.user && roleConfirm.newRole) {
      updateRoleMutation.mutate({ 
        id: roleConfirm.user.id, 
        role: roleConfirm.newRole 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-bold"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
          <p className="text-sm font-bold text-blue-600 mb-1">Total Users</p>
          <p className="text-2xl font-black text-blue-900">{data?.data.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
          <p className="text-sm font-bold text-green-600 mb-1">Active Users</p>
          <p className="text-2xl font-black text-green-900">
            {data?.data.filter(u => u.isActive).length || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
          <p className="text-sm font-bold text-red-600 mb-1">Blocked Users</p>
          <p className="text-2xl font-black text-red-900">
            {data?.data.filter(u => !u.isActive).length || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
          <p className="text-sm font-bold text-purple-600 mb-1">Admins</p>
          <p className="text-2xl font-black text-purple-900">
            {data?.data.filter(u => u.role === 'ADMIN').length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`table-row-animate ${!user.isActive ? 'bg-red-50' : ''} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {user.firstName?.[0] || user.phoneNumber[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {user.firstName || 'N/A'} {user.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{user.phoneNumber}</p>
                    <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as 'USER' | 'ADMIN')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? '✓ Active' : '🚫 Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-semibold">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleBlock(user)}
                        className={`button-animate ${user.isActive 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {user.isActive ? '🚫 Block' : '✓ Unblock'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block/Unblock Confirmation */}
      <ConfirmDialog
        isOpen={blockConfirm.isOpen}
        onClose={() => setBlockConfirm({ isOpen: false, user: null })}
        onConfirm={confirmBlock}
        title={blockConfirm.user?.isActive ? "Block User" : "Unblock User"}
        message={`Are you sure you want to ${blockConfirm.user?.isActive ? 'block' : 'unblock'} ${blockConfirm.user?.firstName || blockConfirm.user?.phoneNumber}? ${blockConfirm.user?.isActive ? 'They will not be able to access the platform.' : 'They will regain access to the platform.'}`}
        confirmText={blockConfirm.user?.isActive ? "Block User" : "Unblock User"}
        cancelText="Cancel"
        type={blockConfirm.user?.isActive ? "danger" : "info"}
        icon={blockConfirm.user?.isActive ? "🚫" : "✓"}
      />

      {/* Role Change Confirmation */}
      <ConfirmDialog
        isOpen={roleConfirm.isOpen}
        onClose={() => setRoleConfirm({ isOpen: false, user: null, newRole: null })}
        onConfirm={confirmRoleChange}
        title="Change User Role"
        message={`Change ${roleConfirm.user?.firstName || roleConfirm.user?.phoneNumber}'s role to ${roleConfirm.newRole}? This will grant ${roleConfirm.newRole === 'ADMIN' ? 'administrative' : 'regular user'} privileges.`}
        confirmText="Change Role"
        cancelText="Cancel"
        type="warning"
        icon="👑"
      />
    </div>
  );
}
