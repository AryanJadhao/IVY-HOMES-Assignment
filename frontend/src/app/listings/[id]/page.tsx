"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Listing } from "@/types";
import Link from "next/link";
import { useFavourites } from "@/hooks/useFavourites";

function getNormalizedArea(listing: Listing) {
  if (listing.website === "magichomes" || listing.carpet_area < 300) {
    return Math.round(listing.carpet_area * 10.7639);
  }
  return listing.carpet_area;
}

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavourite, toggleFavourite } = useFavourites();

  useEffect(() => {
    if (!id) return;
    
    async function loadData() {
      try {
        const data = await apiFetch(`/v1/listings/${id}`);
        setListing(data);
        
        // Similar listings
        try {
          const simData = await apiFetch(`/v1/listings/${id}/similar`);
          // The API might not wrap in 'results' based on our probe, but let's safely handle it
          const simList = simData.results || (Array.isArray(simData) ? simData : []);
          setSimilar(simList);
        } catch (e) {
          console.warn("Failed to fetch similar listings", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading property details...</div>;
  if (!listing) return <div className="p-8 text-center text-red-600">Property not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Listings</Link>
        <button 
          onClick={() => toggleFavourite(listing)}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 bg-white text-black font-medium shadow-sm transition"
        >
          {isFavourite(listing.listing_id) ? "❤️ Remove from Saved" : "🤍 Save Property"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.apartment_name || "Independent Property"}</h1>
              <p className="text-lg text-gray-600 capitalize">{listing.locality}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">₹{(listing.price / 100000).toFixed(2)} L</p>
              <p className="text-sm text-gray-500 mt-1">₹{Math.round(listing.price / getNormalizedArea(listing)).toLocaleString()} per sqft</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Configuration</p>
            <p className="font-semibold text-gray-900">{listing.bedroom} BHK, {listing.bathroom} Baths</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Area</p>
            <p className="font-semibold text-gray-900">{getNormalizedArea(listing)} sqft</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Floor</p>
            <p className="font-semibold text-gray-900">{listing.floor} of {listing.total_floors}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Furnishing</p>
            <p className="font-semibold text-gray-900 capitalize">{listing.furnishing.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-900">About this property</h2>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Contact Seller</h3>
            <p className="text-blue-800"><span className="font-semibold">{listing.posted_by_name}</span> ({listing.posted_by})</p>
            <p className="text-blue-800 text-lg mt-1 font-bold">{listing.posted_by_contact}</p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.slice(0, 3).map((sim) => (
              <Link key={sim.listing_id} href={`/listings/${sim.listing_id}`} className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                <h3 className="font-bold text-gray-900 mb-1">{sim.apartment_name || "Property"}</h3>
                <p className="text-gray-600 text-sm mb-2 capitalize">{sim.locality}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">₹{(sim.price / 100000).toFixed(2)} L</span>
                  <span className="text-sm text-gray-500">{sim.bedroom} BHK</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
