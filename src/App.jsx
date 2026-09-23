import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NewService from './pages/NewService';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-700">
        {/* Barra de Navegación Superior */}
        <Navbar />

        {/* Contenido Principal de las Rutas */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nuevo" element={<NewService />} />
            {/* Redirección por defecto a Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Pie de página discreto */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          AutoGestión Taller &copy; {new Date().getFullYear()} - Sistema de Mapeo y Control de Servicios
        </footer>
      </div>
    </BrowserRouter>
  );
}
