import React, { useState } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';

const TIPOS_COMUNES = [
  'Rayón / Raspón',
  'Abolladura / Golpe',
  'Pintura dañada',
  'Cristal roto / Fisura',
  'Faltante de pieza'
];

export default function CarDamageMap({ danos = [], onChange, readOnly = false }) {
  // Estado para capturar punto pendiente antes de confirmar el tipo de daño
  const [pendingPoint, setPendingPoint] = useState(null);
  const [tipoInput, setTipoInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(TIPOS_COMUNES[0]);

  // Manejador del clic sobre el contenedor del auto
  const handleMapClick = (e) => {
    if (readOnly) return;

    // Calcular posición en porcentaje usando getBoundingClientRect()
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = parseFloat(((clickX / rect.width) * 100).toFixed(2));
    const y = parseFloat(((clickY / rect.height) * 100).toFixed(2));

    setPendingPoint({ x, y });
    setTipoInput('');
    setSelectedPreset(TIPOS_COMUNES[0]);
  };

  // Confirmar el nuevo daño y agregarlo a la lista
  const handleConfirmDamage = (e) => {
    if (e) e.preventDefault();
    if (!pendingPoint) return;

    const tipoFinal = tipoInput.trim() || selectedPreset || 'Daño no especificado';
    const nuevoDano = {
      id: `dano-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: pendingPoint.x,
      y: pendingPoint.y,
      tipo: tipoFinal
    };

    const nuevosDanos = [...danos, nuevoDano];
    if (onChange) onChange(nuevosDanos);

    setPendingPoint(null);
    setTipoInput('');
  };

  // Cancelar la adición del daño actual
  const handleCancelDamage = () => {
    setPendingPoint(null);
    setTipoInput('');
  };

  // Eliminar un daño registrado
  const handleRemoveDamage = (idToRemove) => {
    if (readOnly) return;
    const nuevosDanos = danos.filter((d) => d.id !== idToRemove);
    if (onChange) onChange(nuevosDanos);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Indicador de ayuda */}
      {!readOnly && (
        <div className="w-full mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Haz clic en cualquier parte de la silueta para registrar un daño previo (rayón, golpe, etc.).
            </span>
          </div>
          <span className="font-semibold bg-amber-200/60 px-2 py-0.5 rounded text-amber-900">
            {danos.length} {danos.length === 1 ? 'daño marcado' : 'daños marcados'}
          </span>
        </div>
      )}

      {/* Contenedor relativo del auto para posicionar los marcadores */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white p-4 max-w-sm w-full flex justify-center shadow-inner overflow-hidden select-none">
        <div
          onClick={handleMapClick}
          className={`relative inline-block w-[300px] h-[600px] ${
            !readOnly ? 'cursor-crosshair' : 'cursor-default'
          }`}
          title={!readOnly ? 'Haz clic para marcar un daño' : 'Mapa de daños'}
        >
          {/* Imagen de la silueta del vehículo */}
          <img
            src="/car-silhouette.png"
            alt="Silueta de automóvil - Vista Superior"
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Renderizado de marcadores guardados */}
          {danos.map((dano, index) => (
            <div
              key={dano.id || index}
              className="absolute group z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${dano.x}%`, top: `${dano.y}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Punto indicador rojo con pulso */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-60"></span>
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center w-6 h-6 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
                >
                  {index + 1}
                </button>
              </div>

              {/* Tooltip con información y opción de eliminar */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-20 whitespace-nowrap">
                <div className="bg-slate-900 text-white text-xs py-1 px-2.5 rounded shadow-lg flex items-center gap-2">
                  <span>{dano.tipo}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDamage(dano.id)}
                      className="text-red-400 hover:text-red-300 ml-1 p-0.5"
                      title="Eliminar este punto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
              </div>
            </div>
          ))}

          {/* Marcador temporal pendiente */}
          {pendingPoint && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
            >
              <span className="flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white"></span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Diálogo para ingresar el tipo de daño al hacer clic */}
      {pendingPoint && (
        <div className="mt-4 w-full max-w-sm bg-white border border-slate-200 rounded-xl p-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Detalle del daño en ({pendingPoint.x}%, {pendingPoint.y}%)
            </h4>
            <button
              type="button"
              onClick={handleCancelDamage}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Opciones rápidas */}
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_COMUNES.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(tipo);
                    setTipoInput('');
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedPreset === tipo && !tipoInput
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* Input personalizado */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                O escribe una descripción específica:
              </label>
              <input
                type="text"
                value={tipoInput}
                onChange={(e) => {
                  setTipoInput(e.target.value);
                  setSelectedPreset('');
                }}
                placeholder="Ej. Abolladura puerta trasera derecha"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmDamage();
                  }
                }}
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelDamage}
                className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDamage}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
              >
                Guardar Punto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista detallada de daños registrados debajo del auto */}
      {danos.length > 0 && (
        <div className="w-full max-w-sm mt-4">
          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Daños Registrados ({danos.length})
          </h5>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {danos.map((dano, index) => (
              <div
                key={dano.id || index}
                className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                    {index + 1}
                  </span>
                  <span className="text-slate-800 font-medium">{dano.tipo}</span>
                  <span className="text-[10px] text-slate-400">
                    ({dano.x}%, {dano.y}%)
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDamage(dano.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Eliminar daño"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
