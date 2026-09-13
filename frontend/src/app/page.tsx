"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Listing } from "@/types";
import Link from "next/link";
import { useFavourites } from "@/hooks/useFavourites";

// Normalizes carpet area fixing the magichomes sqm bug
function getNormalizedArea(listing: Listing) {
  if (listing.website === "magichomes" || listing.carpet_area < 300) {
    return Math.round(listing.carpet_area * 10.7639);
  }
  return listing.carpet_area;
}

export default function ListingsPage() {
  const { token, isLoading } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  
  // Data State
  const [allFetchedListings, setAllFetchedListings] = useState<Listing[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalReported, setTotalReported] = useState(0);

  // Filter State
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchBatch = useCallback(async () => {
    if (!token || isFetching || !hasMore) return;
    setIsFetching(true);
    
    try {
      const data = await apiFetch(`/v1/listings?offset=${offset}`);
      const results: Listing[] = data.results || [];
      
      setAllFetchedListings((prev) => {
        // Deduplicate just in case
        const existingIds = new Set(prev.map(l => l.listing_id));
        const newItems = results.filter(l => !existingIds.has(l.listing_id));
        return [...prev, ...newItems];
      });
      
      setTotalReported(data.total || 0);
      setOffset((prev) => prev + results.length);
      
      if (results.length === 0 || (data.total && offset + results.length >= data.total)) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setIsFetching(false);
    }
  }, [token, offset, isFetching, hasMore]);

  // Initial load
  useEffect(() => {
    if (token && allFetchedListings.length === 0 && hasMore && !isFetching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBatch();
    }
  }, [token, allFetchedListings.length, hasMore, isFetching, fetchBatch]);

  // Apply Client-Side Filters & Clean up lies
  const filteredListings = allFetchedListings.filter((l) => {
    // Lie: Endpoint returns inactive listings. Must filter them manually.
    if (!l.is_live) return false;
    
    if (locality && l.locality.toLowerCase() !== locality.toLowerCase()) return false;
    if (bhk && l.bedroom !== parseInt(bhk)) return false;
    if (furnishing && l.furnishing !== furnishing) return false;
    if (minPrice && l.price < parseInt(minPrice)) return false;
    if (maxPrice && l.price > parseInt(maxPrice)) return false;
    return true;
  });

  // If the user has applied filters but we don't have enough results on screen, 
  // automatically fetch the next batch to ensure the filter "works".
  useEffect(() => {
    if ((locality || bhk || furnishing || minPrice || maxPrice) && filteredListings.length < 10 && hasMore && !isFetching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBatch();
    }
  }, [locality, bhk, furnishing, minPrice, maxPrice, filteredListings.length, hasMore, isFetching, fetchBatch]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading session...</div>;
  if (!token) return <div className="p-8 text-center text-gray-500">Please login to view listings.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Browse Listings</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4">
        <input 
          type="text" 
          placeholder="Locality (e.g. whitefield)" 
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black"
        />
        <select value={bhk} onChange={(e) => setBhk(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-black bg-white">
          <option value="">Any BHK</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4+ BHK</option>
        </select>
        <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-black bg-white">
          <option value="">Any Furnishing</option>
          <option value="unfurnished">Unfurnished</option>
          <option value="semi-furnished">Semi-Furnished</option>
          <option value="fully-furnished">Fully-Furnished</option>
        </select>
        <input 
          type="number" 
          placeholder="Min Price" 
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black w-32"
        />
        <input 
          type="number" 
          placeholder="Max Price" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-black w-32"
        />
      </div>

      <div className="mb-4 text-sm text-gray-600 flex justify-between">
        <span>Showing {filteredListings.length} results (Fetched {allFetchedListings.length} of {totalReported} total server records)</span>
        {isFetching && <span className="text-blue-600 font-medium animate-pulse">Fetching more from API...</span>}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <div key={listing.listing_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition relative">
            <button 
              onClick={() => toggleFavourite(listing)}
              className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-sm hover:scale-110 transition"
              title={isFavourite(listing.listing_id) ? "Remove from Saved" : "Save Listing"}
            >
              {isFavourite(listing.listing_id) ? "❤️" : "🤍"}
            </button>
            <Link href={`/listings/${listing.listing_id}`}>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{listing.apartment_name || "Independent Property"}</h3>
                <p className="text-gray-500 text-sm mb-4 capitalize">{listing.locality}</p>
                
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{(listing.price / 100000).toFixed(2)} L
                    </p>
                    <p className="text-xs text-gray-500 mt-1">₹{Math.round(listing.price / getNormalizedArea(listing)).toLocaleString()}/sqft</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{listing.bedroom} BHK</p>
                    <p className="text-sm text-gray-500">{getNormalizedArea(listing)} sqft</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded capitalize">{listing.furnishing.replace('-', ' ')}</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded capitalize">{listing.property_type}</span>
                  {listing.is_verified && <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">Verified</span>}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {filteredListings.length === 0 && !isFetching && (
        <div className="py-12 text-center text-gray-500">
          No listings match your filters in the currently fetched data. Try fetching more.
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={fetchBatch} 
            disabled={isFetching}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {isFetching ? "Loading..." : "Load More Listings"}
          </button>
        </div>
      )}
    </div>
  );
}
