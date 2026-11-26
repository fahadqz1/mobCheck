import React, { useEffect, useState } from 'react';

interface Listing {
  id: string;
  title: string;
  brand: { name: string };
  model: { name: string };
  pricePkr: number;
  condition: string;
  ptaStatus: string;
  user: { firstName: string };
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Lahore');

  useEffect(() => {
    fetchListings();
  }, [city]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/listings?page=1&limit=12&city=${city}`);
      const data = await response.json();
      setListings(data.data || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
    setLoading(false);
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

      {/* Search & Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Find Your Perfect Phone</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search phones..."
              className="border rounded px-4 py-2"
            />

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

            <select className="border rounded px-4 py-2">
              <option>All Conditions</option>
              <option>Brand New</option>
              <option>Like New</option>
              <option>Excellent</option>
              <option>Good</option>
            </select>

            <button
              onClick={fetchListings}
              className="bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="bg-gray-200 h-48 rounded-t-lg flex items-center justify-center">
                  <span className="text-gray-400">📱</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {listing.brand.name} {listing.model.name}
                  </p>
                  <div className="mb-3">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">
                      {listing.condition}
                    </span>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {listing.ptaStatus}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-xl font-bold text-indigo-600">Rs. {Number(listing.pricePkr).toLocaleString()}</span>
                    <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
