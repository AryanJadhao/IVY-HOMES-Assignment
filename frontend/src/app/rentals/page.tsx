"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Rental } from "@/types";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    
    try {
      const data = await apiFetch(`/v1/rentals?offset=${offset}`);
      const results: Rental[] = data.results || [];
      
      setRentals((prev) => [...prev, ...results]);
      setOffset((prev) => prev + results.length);
      
      if (results.length === 0 || (data.total && offset + results.length >= data.total)) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  }, [offset, isFetching, hasMore]);

  useEffect(() => {
    if (rentals.length === 0 && hasMore && !isFetching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBatch();
    }
  }, [rentals.length, hasMore, isFetching, fetchBatch]);

  // Fix the Deposit Bug (some deposits are recorded as "months" instead of "INR")
  const getCorrectedDeposit = (rental: Rental) => {
    if (rental.deposit < 20) {
      return rental.price * rental.deposit;
    }
    return rental.deposit;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Browse Rentals</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rentals.map((rental) => (
          <div key={rental.listing_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{rental.title || rental.apartment_name}</h3>
              <p className="text-gray-500 text-sm mb-4 capitalize">{rental.locality}</p>
              
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600">₹{rental.price.toLocaleString()}/mo</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Deposit: ₹{getCorrectedDeposit(rental).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">{rental.bedroom} BHK</p>
                  <p className="text-sm text-gray-500">{rental.carpet_area} sqft</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={fetchBatch} 
            disabled={isFetching}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
          >
            {isFetching ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
