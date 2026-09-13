"use client";

import { useState, useEffect } from 'react';
import { Listing } from '@/types';

export function useFavourites() {
  const [favourites, setFavourites] = useState<Listing[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ivy_favourites');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavourites(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleFavourite = (listing: Listing) => {
    setFavourites((prev) => {
      const exists = prev.some((f) => f.listing_id === listing.listing_id);
      let next;
      if (exists) {
        next = prev.filter((f) => f.listing_id !== listing.listing_id);
      } else {
        next = [...prev, listing];
      }
      localStorage.setItem('ivy_favourites', JSON.stringify(next));
      return next;
    });
  };

  const isFavourite = (id: string) => {
    return favourites.some((f) => f.listing_id === id);
  };

  return { favourites, toggleFavourite, isFavourite };
}
