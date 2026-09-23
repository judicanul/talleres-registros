import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import CarDamageMap from '../components/CarDamageMap';
import { 
  Car, 
  User, 
  Phone, 
  Gauge, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  Save
} from 'lucide-react';

export default function NewService() {
  const navigate = useNavigate();

  // Estados del formulario
  const [formData, setFormData] = useState({
    placa: '',
    clienteNombre: '',
    clienteTelefono: '',
    vehiculoModelo: '',
    vehiculoKilometraje: '',
    servicioDetalle: ''
  });

  // Estado para los daños previos mapeados
  const [danosPrevios, setDanosPrevios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Manejar cambios en inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Envío del formulario a Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!formData.placa.trim()) {
      setError('La placa del vehículo es obligatoria.');
      return;
    }
    if (!formData.clienteNombre.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!formData.vehiculoModelo.trim()) {
      setError('El modelo del vehículo es obligatorio.');
      return;
    }
    if (!formData.servicioDetalle.trim()) {
      setError('Debes describir el servicio o motivo de ingreso.');
      return;
    }

    try {
      setLoading(true);

      // Inserción en la tabla 'registros_servicio' de Supabase
      const { data, error: insertError } = await supabase
        .from('registros_servicio')
        .insert([
          {
            placa: formData.placa.trim().toUpperCase(),
            cliente_nombre: formData.clienteNombre.trim(),
            cliente_telefono: formData.clienteTelefono.trim(),
            vehiculo_modelo: formData.vehiculoModelo.trim(),
            vehiculo_kilometraje: formData.vehiculoKilometraje ? Number(formData.vehiculoKilometraje) : 0,
            servicio_detalle: formData.servicioDetalle.trim(),
            estado: 'En fila', // Estado inicial por regla de negocio
            danos_previos: danosPrevios
          }
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      console.error('Error al registrar servicio en Supabase:', err);
      setError(`No se pudo guardar el registro: ${err.message || 'Error de conexión con Supabase'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            Registro de Ingreso de Vehículo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Captura los datos del cliente, unidad y mapea los daños físicos preexistentes antes de iniciar el servicio.
          </p>
        </div>
      </div>

      {/* Notificaciones */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>¡Vehículo registrado exitosamente en Supabase con estado "En fila"! Redirigiendo...</span>
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Información del Cliente, Auto y Servicio (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta: Información del Cliente */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Datos del Cliente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="clienteNombre"
                    value={formData.clienteNombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="clienteTelefono"
                    value={formData.clienteTelefono}
                    onChange={handleChange}
                    placeholder="Ej. +52 999 123 4567"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta: Datos del Vehículo */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Datos del Vehículo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Placa *
                </label>
                <input
                  type="text"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  required
                  placeholder="Ej. XYZ-987"
                  className="w-full uppercase font-mono tracking-wider px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Modelo / Marca *
                </label>
                <input
                  type="text"
                  name="vehiculoModelo"
                  value={formData.vehiculoModelo}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Nissan Versa 2021"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kilometraje
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="vehiculoKilometraje"
                    value={formData.vehiculoKilometraje}
                    onChange={handleChange}
                    placeholder="Ej. 45000"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta: Detalle del Servicio */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Detalle del Servicio Solicitado
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descripción de la Falla o Mantenimiento *
              </label>
              <textarea
                name="servicioDetalle"
                value={formData.servicioDetalle}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe el trabajo a realizar (ej. Cambio de balatas delanteras, cambio de aceite y filtro, revisión de ruidos en suspensión...)"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando en Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Completar Registro de Ingreso</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Mapeo de Daños Previos (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm sticky top-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Inspección de Daños Previos
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic sobre la silueta para marcar los detalles estéticos o golpes preexistentes antes de aceptar la unidad.
              </p>
            </div>

            {/* Componente CarDamageMap */}
            <CarDamageMap
              danos={danosPrevios}
              onChange={(nuevosDanos) => setDanosPrevios(nuevosDanos)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
