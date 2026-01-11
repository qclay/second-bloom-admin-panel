'use client';

export default function NotificationsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Manage system notifications</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
            <span className="text-5xl">🔔</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Notification Center
          </h3>
          <p className="text-gray-600 mb-6">
            Send and manage push notifications to users. 
            Keep customers informed about orders, promotions, and updates.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg text-sm text-red-700 font-semibold">
            🔜 Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
