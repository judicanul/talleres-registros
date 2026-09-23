import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/config';
import CarDamageMap from '../components/CarDamageMap';
import { 
  Car, 
  Plus, 
  Clock, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  X, 
  Phone, 
  Gauge, 
  Filter, 
  Search, 
  RefreshCw 
} from 'lucide-react';

const ESTADOS = [
  'En fila',
  'En revisión',
  'Esperando refacciones',
  'Listo para entrega',
  'Entregado'
];

// Configuración de colores para cada estado
const ESTADO_BADGES = {
  'En fila': 'bg-amber-100 text-amber-800 border-amber-300',
  'En revisión': 'bg-blue-100 text-blue-800 border-blue-300',
  'Esperando refacciones': 'bg-purple-100 text-purple-800 border-purple-300',
  'Listo para entrega': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Entregado': 'bg-slate-100 text-slate-600 border-slate-300'
};

export default function Dashboard() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'activos' | 'todos' | estado específico
  const [busqueda, setBusqueda] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null); // Para modal de detalles
  const [actualizandoId, setActualizandoId] = useState(null);

  // Cargar registros iniciales y suscribirse a Supabase Realtime
  useEffect(() => {
    // 1. Consulta inicial de registros
    const fetchRegistros = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('registros_servicio')
          .select('*')
          .order('hora_ingreso', { ascending: false });

        if (error) throw error;
        setRegistros(data || []);
      } catch (err) {
        console.error('Error al cargar registros desde Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistros();

    // 2. Suscripción en tiempo real con Supabase Realtime
    const channel = supabase
      .channel('registros_servicio_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros_servicio' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRegistros((prev) => [payload.new, ...prev.filter((r) => r.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setRegistros((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
            // Actualizar también en el modal si está abierto
            setSelectedVehicle((prev) => (prev?.id === payload.new.id ? payload.new : prev));
          } else if (payload.eventType === 'DELETE') {
            setRegistros((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Actualizar estado del vehículo en Supabase
  const handleStatusChange = async (id, nuevoEstado) => {
    try {
      setActualizandoId(id);
      const { error } = await supabase
        .from('registros_servicio')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      // Actualización optimista local
      setRegistros((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
      );
    } catch (error) {
      console.error('Error al actualizar estado en Supabase:', error);
      alert(`No se pudo actualizar el estado: ${error.message}`);
    } finally {
      setActualizandoId(null);
    }
  };

  // Filtrado de registros
  const registrosFiltrados = registros.filter((item) => {
    // Filtro por estado
    if (filtroEstado === 'activos' && item.estado === 'Entregado') return false;
    if (filtroEstado !== 'activos' && filtroEstado !== 'todos' && item.estado !== filtroEstado) return false;

    // Filtro por búsqueda de texto (placa, cliente o modelo)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const placaMatch = item.placa?.toLowerCase().includes(q);
      const clienteMatch = (item.cliente_nombre || item.cliente?.nombre)?.toLowerCase().includes(q);
      const modeloMatch = (item.vehiculo_modelo || item.vehiculo?.modelo)?.toLowerCase().includes(q);
      return placaMatch || clienteMatch || modeloMatch;
    }

    return true;
  });

  // Métricas rápidas
  const totalActivos = registros.filter((r) => r.estado !== 'Entregado').length;
  const enFila = registros.filter((r) => r.estado === 'En fila').length;
  const enRevision = registros.filter((r) => r.estado === 'En revisión' || r.estado === 'Esperando refacciones').length;
  const listos = registros.filter((r) => r.estado === 'Listo para entrega').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            Control de Taller Automotriz
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoreo en tiempo real de unidades en servicio y flujo de trabajo con Supabase.
          </p>
        </div>

        <Link
          to="/nuevo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ingreso
        </Link>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vehículos Activos</p>
            <p className="text-xl font-bold text-slate-800">{totalActivos}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">En Fila</p>
            <p className="text-xl font-bold text-slate-800">{enFila}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">En Trabajo / Espera</p>
            <p className="text-xl font-bold text-slate-800">{enRevision}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Listos para Entrega</p>
            <p className="text-xl font-bold text-slate-800">{listos}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa, cliente o modelo..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Pestañas de Filtro de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            type="button"
            onClick={() => setFiltroEstado('activos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filtroEstado === 'activos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {ESTADOS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroEstado(st)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filtroEstado === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Registros de Servicio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Cargando registros de Supabase...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No se encontraron vehículos</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {busqueda
                ? 'Ningún registro coincide con los criterios de búsqueda.'
                : 'No hay registros en esta categoría. Puedes ingresar un nuevo vehículo con el botón superior.'}
            </p>
            {!busqueda && (
              <Link
                to="/nuevo"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Registrar Primer Vehículo
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vehículo / Placa</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Servicio Solicitado</th>
                  <th className="py-3.5 px-4">Daños Previos</th>
                  <th className="py-3.5 px-4">Ingreso</th>
                  <th className="py-3.5 px-4">Estado del Servicio</th>
                  <th className="py-3.5 px-4 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {registrosFiltrados.map((item) => {
                  const clienteNombre = item.cliente_nombre || item.cliente?.nombre || 'Sin nombre';
                  const clienteTelefono = item.cliente_telefono || item.cliente?.telefono;
                  const vehiculoModelo = item.vehiculo_modelo || item.vehiculo?.modelo || 'Sin modelo';
                  const vehiculoKm = item.vehiculo_kilometraje ?? item.vehiculo?.kilometraje ?? 0;
                  const servicioDetalle = item.servicio_detalle || item.servicioDetalle || '';
                  const danos = item.danos_previos || item.danosPrevios || [];
                  const danosCount = Array.isArray(danos) ? danos.length : 0;
                  const fechaIngreso = item.hora_ingreso ? new Date(item.hora_ingreso) : null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Vehículo / Placa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-1 rounded shadow-sm">
                            {item.placa}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {vehiculoModelo}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {Number(vehiculoKm).toLocaleString()} km
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800 text-xs sm:text-sm">
                          {clienteNombre}
                        </p>
                        {clienteTelefono && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {clienteTelefono}
                          </p>
                        )}
                      </td>

                      {/* Servicio Solicitado */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2" title={servicioDetalle}>
                          {servicioDetalle}
                        </p>
                      </td>

                      {/* Daños Previos */}
                      <td className="py-3.5 px-4">
                        {danosCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {danosCount} {danosCount === 1 ? 'daño' : 'daños'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-500 bg-slate-100">
                            Sin daños
                          </span>
                        )}
                      </td>

                      {/* Fecha / Hora Ingreso */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {fechaIngreso ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {fechaIngreso.toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {fechaIngreso.toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Reciente</span>
                        )}
                      </td>

                      {/* Selector de Estado en Línea */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block w-44">
                          <select
                            value={item.estado || 'En fila'}
                            disabled={actualizandoId === item.id}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              ESTADO_BADGES[item.estado] || 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            {ESTADOS.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-800 font-normal">
                                {st}
                              </option>
                            ))}
                          </select>
                          {actualizandoId === item.id && (
                            <RefreshCw className="w-3 h-3 text-slate-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                      </td>

                      {/* Botón de Vista Detallada */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicle(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver inspección y detalles completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle con Mapa de Daños Previos (ReadOnly) */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded shadow-sm mr-2">
                  {selectedVehicle.placa}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {selectedVehicle.vehiculo_modelo || selectedVehicle.vehiculo?.modelo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos Resumidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-slate-400 font-medium">Cliente</p>
                <p className="text-slate-800 font-semibold text-sm">
                  {selectedVehicle.cliente_nombre || selectedVehicle.cliente?.nombre}
                </p>
                <p className="text-slate-500">
                  {selectedVehicle.cliente_telefono || selectedVehicle.cliente?.telefono || 'Sin teléfono'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Kilometraje y Estado</p>
                <p className="text-slate-800 font-semibold">
                  {Number(selectedVehicle.vehiculo_kilometraje ?? selectedVehicle.vehiculo?.kilometraje ?? 0).toLocaleString()} km
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${ESTADO_BADGES[selectedVehicle.estado]}`}>
                  {selectedVehicle.estado}
                </span>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400 font-medium">Motivo / Servicio Solicitado</p>
                <p className="text-slate-700 mt-0.5">
                  {selectedVehicle.servicio_detalle || selectedVehicle.servicioDetalle}
                </p>
              </div>
            </div>

            {/* Mapa de Daños en Modo Solo Lectura */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                Mapa de Daños Previos Registrados
              </h4>
              <CarDamageMap
                danos={selectedVehicle.danos_previos || selectedVehicle.danosPrevios || []}
                readOnly={true}
              />
            </div>

            {/* Botón de Cierre */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
