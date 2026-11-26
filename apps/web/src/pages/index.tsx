import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">MobCheck</div>
          <div className="flex gap-4">
            <a href="/auth/login" className="text-gray-700 hover:text-indigo-600">Login</a>
            <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Register</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Check Before You Buy</h1>
        <p className="text-xl text-gray-600 mb-8">Professional mobile phone inspection & verified marketplace</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Browse Phones</h3>
            <p className="text-gray-600">Search from thousands of verified listings</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Professional Inspection</h3>
            <p className="text-gray-600">Get detailed device reports from experts</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold mb-2">Verified Shops</h3>
            <p className="text-gray-600">Buy from trusted mobile retailers</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <a href="/marketplace" className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold">Browse Phones</a>
          <a href="/shops" className="bg-white text-indigo-600 px-8 py-3 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 font-semibold">Find Shops</a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MobCheck?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">🔒 Trust & Safety</h3>
              <p className="text-gray-600">Verified sellers and professional inspections ensure you get what you pay for</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">📊 Transparent Pricing</h3>
              <p className="text-gray-600">No hidden fees. Clear pricing for inspections and services</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">🛡️ Quality Assurance</h3>
              <p className="text-gray-600">Professional device inspection with detailed reports</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">⚡ Fast Service</h3>
              <p className="text-gray-600">Quick inspections and instant report delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Phone?</h2>
          <p className="text-lg mb-8">Join thousands of customers who trust MobCheck</p>
          <a href="/auth/register" className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-semibold">Get Started Now</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 MobCheck. All rights reserved. Check Before You Buy.</p>
        </div>
      </footer>
    </div>
  );
}
