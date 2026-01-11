'use client';

export default function ReviewsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-1">Manage product reviews and ratings</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
            <span className="text-5xl">⭐</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Review Management
          </h3>
          <p className="text-gray-600 mb-6">
            Monitor and moderate customer reviews and ratings for products. 
            Ensure quality feedback and handle disputes.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg text-sm text-yellow-700 font-semibold">
            🔜 Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
