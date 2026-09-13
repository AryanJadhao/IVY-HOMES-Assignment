"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user && pathname === '/login') return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="font-bold text-xl text-blue-600">
            Ivy Homes
          </Link>
          {user && (
            <div className="hidden md:flex space-x-4">
              <Link href="/" className={`hover:text-blue-600 ${pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Listings</Link>
              <Link href="/rentals" className={`hover:text-blue-600 ${pathname === '/rentals' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Rentals</Link>
              <Link href="/projects" className={`hover:text-blue-600 ${pathname === '/projects' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Projects</Link>
              <Link href="/saved" className={`hover:text-blue-600 ${pathname === '/saved' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Saved</Link>
              <Link href="/insights" className={`hover:text-blue-600 ${pathname === '/insights' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Insights</Link>
            </div>
          )}
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
