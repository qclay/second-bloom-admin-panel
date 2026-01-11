'use client';

export default function ChatPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
        <p className="text-gray-600 mt-1">Monitor real-time conversations</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <span className="text-5xl">💬</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Chat Monitoring
          </h3>
          <p className="text-gray-600 mb-6">
            Real-time chat monitoring and management features will be available here. 
            Track conversations between buyers and sellers.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 font-semibold">
            🔜 Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
