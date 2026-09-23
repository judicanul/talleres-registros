import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench, Plus, LayoutDashboard, Car } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logotipo / Marca */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:bg-blue-700 transition">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                AutoGestión <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Taller</span>
              </span>
              <p className="text-[10px] text-slate-400">Sistema de Control Automotriz</p>
            </div>
          </Link>

          {/* Enlaces de Navegación */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-slate-100 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/nuevo"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive('/nuevo')
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Ingreso</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
