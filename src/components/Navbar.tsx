"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, profile, loading, logout } = useAuth();

  return (
    <nav className="w-full fixed top-0 z-50 glass border-b border-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              MaitenConnect
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">
                      {profile?.displayName || user.email}
                      {profile?.role === "PROVIDER" && <span className="ml-2 text-xs bg-primary/20 text-primary-dark px-2 rounded-full">Pro</span>}
                    </span>
                    <button 
                      onClick={logout}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      Salir
                    </button>
                    <Link 
                      href={profile?.role === "PROVIDER" ? "/dashboard/provider" : "/dashboard/client"}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/20"
                    >
                      Mi Panel
                    </Link>
                  </div>
                ) : (
                  <Link 
                    href="/login"
                    className="bg-foreground text-background hover:bg-slate-800 dark:hover:bg-slate-200 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    Acceder
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
