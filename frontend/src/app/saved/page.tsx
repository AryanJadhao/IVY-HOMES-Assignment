"use client";

import { useFavourites } from "@/hooks/useFavourites";
import Link from "next/link";
import { Listing } from "@/types";

export default function SavedPage() {
  const { favourites, toggleFavourite } = useFavourites();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Saved Properties</h1>
      
      {favourites.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
          You haven&apos;t saved any properties yet.
          <div className="mt-4">
            <Link href="/" className="text-blue-600 hover:underline">Browse Listings</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favourites.map((listing: Listing) => (
            <div key={listing.listing_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
              <button 
                onClick={() => toggleFavourite(listing)}
                className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow hover:scale-110 transition text-red-500"
                title="Remove from Saved"
              >
                ❤️
              </button>
              <Link href={`/listings/${listing.listing_id}`}>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{listing.apartment_name || "Property"}</h3>
                  <p className="text-gray-500 text-sm mb-4 capitalize">{listing.locality}</p>
                  
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{(listing.price / 100000).toFixed(2)} L
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {listing.bedroom} BHK • {listing.carpet_area} sqft • {listing.furnishing.replace('-', ' ')}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
