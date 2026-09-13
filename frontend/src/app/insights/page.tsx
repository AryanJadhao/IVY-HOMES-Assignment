"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function InsightsPage() {
  const analyticsData = [
    { name: 'Total Fetchable', listings: 4300 },
    { name: 'Unique Properties', listings: 3381 },
    { name: 'Active (is_live=true)', listings: 3399 },
    { name: 'Inactive/Hidden', listings: 901 },
  ];

  const fakeVsRealData = [
    { name: 'Genuine', value: 4300 - 282, color: '#3b82f6' }, // blue-500
    { name: 'Fake (Lead-Gen Scams)', value: 282, color: '#ef4444' }, // red-500
  ];

  const unitAnomalies = [
    { name: 'Normal (SqFt)', website: '100acres', avgArea: 1135 },
    { name: 'Normal (SqFt)', website: 'zerobroker', avgArea: 1138 },
    { name: 'Anomalous (SqM)', website: 'magichomes', avgArea: 711 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ivy Homes Insights</h1>
        <p className="text-gray-600 text-lg">
          Since the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-red-600">/v1/analytics/summary</code> endpoint is missing (returns 404), 
          these analytics were computed entirely client-side based on the raw JSON dumps and API auditing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">1. Data Integrity & Bloat</h2>
          <p className="text-gray-600 mb-6 text-sm">
            The API documentation claims that <code>listing_id</code> corresponds 1:1 with a physical property and only active listings are returned. 
            Both claims are false. Nearly 1,000 listings are duplicates or inactive.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="listings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">2. Lead-Gen Scams (Fake Listings)</h2>
          <p className="text-gray-600 mb-6 text-sm">
            We uncovered a scam network: dozens of unique phone numbers are masquerading under multiple different alias names (e.g. one phone number used for &quot;Rahul&quot;, &quot;Priya&quot;, and &quot;Amit&quot;). These 282 listings exist purely to harvest leads.
          </p>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fakeVsRealData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fakeVsRealData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">3. The &apos;magichomes&apos; Unit Bug</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <p className="text-gray-600 mb-4">
              The documentation insists that Area is recorded in <span className="font-semibold text-gray-900">Square Feet</span> everywhere. 
              However, when analyzing average sizes across websites, <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-red-600">magichomes</code> 
              showed an anomalously low average of 711. 
            </p>
            <p className="text-gray-600 mb-4">
              Upon closer inspection, properties under 300 area on magichomes are physically impossible as square footage (e.g., a 3 BHK in 110 sqft). 
              They are actually recorded in <span className="font-bold text-red-600">Square Meters</span>. 
            </p>
            <p className="text-gray-600">
              The frontend application currently corrects this silently by multiplying any magichomes area under 300 by <code>10.7639</code> before displaying it or computing price per sqft.
            </p>
          </div>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitAnomalies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="website" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgArea" fill="#8b5cf6" name="Average Area (Raw API Value)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-gray-800">4. Additional Discrepancies</h2>
        <ul className="space-y-4 text-gray-700 list-disc pl-5">
          <li><strong>Projects API Unit Bug:</strong> Project &apos;price_min&apos; is recorded in Lakhs, while &apos;price_max&apos; is recorded in Crores. A project costing 98 Lakhs to 2.7 Crores is returned as &apos;price_min: 98.0, price_max: 2.74&apos;.</li>
          <li><strong>Rentals API Deposit Bug:</strong> Some rental deposits are recorded as absolute INR (e.g. ₹1,50,000), while others are recorded as months of rent (e.g. &apos;6&apos; or &apos;8&apos;). The frontend dynamically multiplies deposits &lt; 20 by the monthly rent to correct this.</li>
          <li><strong>Pagination:</strong> The API entirely ignores the &apos;page&apos; parameter in favor of &apos;offset&apos;, and caps &apos;limit&apos; to 50 regardless of the requested value.</li>
        </ul>
      </div>

    </div>
  );
}
