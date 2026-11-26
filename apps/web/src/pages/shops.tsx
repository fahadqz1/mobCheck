import React, { useEffect, useState } from 'react';

interface Shop {
  id: string;
  name: string;
  city: string;
  area: string;
  phone: string;
  averageRating: number;
  totalReviews: number;
  status: string;
}

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Lahore');

  useEffect(() => {
    fetchShops();
  }, [city]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shops?page=1&limit=12&city=${city}`);
      const data = await response.json();
      setShops(data.data || []);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating || 0));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-indigo-600">MobCheck</a>
          <div className="flex gap-4">
            <a href="/auth/login" className="text-gray-700 hover:text-indigo-600">Login</a>
            <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded">Register</a>
          </div>
        </div>
      </nav>

      {/* Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Find Verified Mobile Shops</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="border rounded px-4 py-2"
              onChange={(e) => setCity(e.target.value)}
              value={city}
            >
              <option>Lahore</option>
              <option>Karachi</option>
              <option>Islamabad</option>
              <option>Rawalpindi</option>
            </select>

            <input
              type="text"
              placeholder="Search shop name..."
              className="border rounded px-4 py-2"
            />

            <button
              onClick={fetchShops}
              className="bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No shops found in this area yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div key={shop.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-24 rounded-t-lg flex items-center justify-center">
                  <span className="text-white text-4xl">🏪</span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{shop.name}</h3>
                  <p className="text-gray-600 text-sm mb-1">📍 {shop.area}, {shop.city}</p>
                  <p className="text-gray-600 text-sm mb-4">📱 {shop.phone}</p>

                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating</span>
                      <span className="text-lg">{renderStars(shop.averageRating)} {shop.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{shop.totalReviews} reviews</p>
                  </div>

                  <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded mb-4">
                    ✓ Verified
                  </span>

                  <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-semibold">
                    Book Inspection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
