"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    
    try {
      const data = await apiFetch(`/v1/projects?offset=${offset}`);
      const results: Project[] = data.results || [];
      
      setProjects((prev) => [...prev, ...results]);
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
    if (projects.length === 0 && hasMore && !isFetching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBatch();
    }
  }, [projects.length, hasMore, isFetching, fetchBatch]);

  // Fix the price bug in projects (API returns Lakhs/Crores instead of INR)
  const formatProjectPrice = (val: number) => {
    if (val < 10) {
      return `₹${val.toFixed(2)} Cr`;
    } else {
      return `₹${val.toFixed(2)} L`;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">New Builder Projects</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.project_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900">{proj.apartment_name}</h3>
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">
                  {proj.project_status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">By {proj.developer_name} • <span className="capitalize">{proj.locality}</span></p>
              
              <div className="mb-4">
                <p className="text-xl font-bold text-gray-900">
                  {formatProjectPrice(proj.price_min)} - {formatProjectPrice(proj.price_max)}
                </p>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Area: {proj.min_area_sqft} - {proj.max_area_sqft} sqft</p>
                <p>Units: {proj.total_units} in {proj.total_towers} towers</p>
                <p>Possession: {proj.possession_date}</p>
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
