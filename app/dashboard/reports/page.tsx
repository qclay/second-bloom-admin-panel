'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/translations';

interface Report {
  id: string;
  reportedUser: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  reportedBy: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export default function ReportsPage() {
  const t = useTranslations();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [blockConfirm, setBlockConfirm] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
    isOpen: false,
    userId: null,
    userName: '',
  });
  const [resolveConfirm, setResolveConfirm] = useState<{ isOpen: boolean; reportId: string | null }>({
    isOpen: false,
    reportId: null,
  });

  const mockReports: Report[] = [
    {
      id: '1',
      reportedUser: {
        id: 'user1',
        name: 'John Doe',
        phoneNumber: '+998901234567',
      },
      reportedBy: {
        id: 'user2',
        name: 'Jane Smith',
        phoneNumber: '+998907654321',
      },
      reason: 'Inappropriate Content',
      description: 'Posted offensive images in product listing',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ];

  const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    REVIEWED: 'bg-blue-100 text-blue-700 border-blue-300',
    RESOLVED: 'bg-green-100 text-green-700 border-green-300',
    DISMISSED: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const stats = [
    { labelKey: 'reports.totalReports' as const, value: mockReports.length, color: 'from-blue-50 to-blue-100', border: 'border-blue-200' },
    { labelKey: 'reports.pending', value: mockReports.filter(r => r.status === 'PENDING').length, color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200' },
    { labelKey: 'reports.resolved', value: mockReports.filter(r => r.status === 'RESOLVED').length, color: 'from-green-50 to-green-100', border: 'border-green-200' },
    { labelKey: 'reports.dismissed', value: mockReports.filter(r => r.status === 'DISMISSED').length, color: 'from-gray-50 to-gray-100', border: 'border-gray-200' },
  ];

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('reports.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div key={stat.labelKey} className={`bg-gradient-to-br ${stat.color} rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${stat.border}`}>
            <p className="text-xs sm:text-sm font-bold text-gray-600 mb-0.5 sm:mb-1">{t(stat.labelKey)}</p>
            <p className="text-xl sm:text-3xl font-black text-gray-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
        {['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
              selectedStatus === status
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {mockReports.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl">✓</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              No Reports
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Great! There are no user reports at the moment. 
              Your community is safe and well-behaved.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mockReports.map((report, index) => (
            <div 
              key={report.id} 
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden card-animate animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1 rounded-full text-xs font-bold border-2 ${STATUS_COLORS[report.status]}`}>
                        {report.status}
                      </span>
                      <span className="text-sm text-gray-500 font-semibold">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">
                      🚨 {report.reason}
                    </h3>
                    <p className="text-gray-700 font-semibold mb-4">{report.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">REPORTED USER</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                        {report.reportedUser.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{report.reportedUser.name}</p>
                        <p className="text-sm text-gray-600">{report.reportedUser.phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">REPORTED BY</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {report.reportedBy.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{report.reportedBy.name}</p>
                        <p className="text-sm text-gray-600">{report.reportedBy.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-blue-500 hover:bg-blue-600 button-animate"
                    onClick={() => toast.info('Review feature coming soon')}
                  >
                    👁️ Review Report
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 button-animate"
                    onClick={() => setBlockConfirm({ 
                      isOpen: true, 
                      userId: report.reportedUser.id, 
                      userName: report.reportedUser.name 
                    })}
                  >
                    🚫 Block User
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 button-animate"
                    onClick={() => setResolveConfirm({ isOpen: true, reportId: report.id })}
                  >
                    ✓ Resolve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 button-animate"
                    onClick={() => toast.success('Report dismissed')}
                  >
                    ✕ Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={blockConfirm.isOpen}
        onClose={() => setBlockConfirm({ isOpen: false, userId: null, userName: '' })}
        onConfirm={() => {
          toast.success(`User ${blockConfirm.userName} has been blocked`);
          setBlockConfirm({ isOpen: false, userId: null, userName: '' });
        }}
        title="Block User"
        message={`Are you sure you want to block ${blockConfirm.userName}? They will not be able to access the platform.`}
        confirmText="Block User"
        cancelText="Cancel"
        type="danger"
        icon="🚫"
      />

      <ConfirmDialog
        isOpen={resolveConfirm.isOpen}
        onClose={() => setResolveConfirm({ isOpen: false, reportId: null })}
        onConfirm={() => {
          toast.success('Report marked as resolved');
          setResolveConfirm({ isOpen: false, reportId: null });
        }}
        title="Resolve Report"
        message="Mark this report as resolved? This action will close the report."
        confirmText="Resolve"
        cancelText="Cancel"
        type="info"
        icon="✓"
      />
    </div>
  );
}
