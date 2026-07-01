import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";

interface FiltersModalProps {
  onClose: () => void;
  onApply: (filters: FilterStates) => void;
  currentFilters: FilterStates;
}

export interface FilterStates {
  disciplines: string[];
  durations: string[];
  horarios: string[];
  maxPrice: number;
  modalities: string[];
  zones: string[];
  minExperience: number;
  groupTypes: string[];
}

const ALL_DISCIPLINES = [
  "Gimnasio", "Running", "Funcional", "Yoga-Pilates", "Natacion", 
  "Ciclismo", "Atletismo", "Boxeo", "Futbol", "Basquet"
];

const ALL_ZONES = [
  "Centro", "Norte", "Sur", "Costanera", "A domicilio", "Online"
];

const ALL_DURATIONS = [
  "30 min", "45 min", "60 min", "75 min", "90 min", "Variable"
];

const ALL_HOURS = [
  "Manana", "Mediodia", "Tarde", "Noche", "Fines de semana"
];

const ALL_MODALITIES = [
  "Presencial", "A domicilio", "Online"
];

const ALL_GROUP_TYPES = [
  "Individual", "Grupos"
];

export const FiltersModal: React.FC<FiltersModalProps> = ({
  onClose,
  onApply,
  currentFilters
}) => {
  // Local filter states
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(currentFilters.disciplines);
  const [selectedDurations, setSelectedDurations] = useState<string[]>(currentFilters.durations);
  const [selectedHorarios, setSelectedHorarios] = useState<string[]>(currentFilters.horarios);
  const [maxPrice, setMaxPrice] = useState<number>(currentFilters.maxPrice);
  const [selectedModalities, setSelectedModalities] = useState<string[]>(currentFilters.modalities);
  const [selectedZones, setSelectedZones] = useState<string[]>(currentFilters.zones);
  const [minExperience, setMinExperience] = useState<number>(currentFilters.minExperience);
  const [selectedGroupTypes, setSelectedGroupTypes] = useState<string[]>(currentFilters.groupTypes);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleClearAll = () => {
    setSelectedDisciplines([]);
    setSelectedDurations([]);
    setSelectedHorarios([]);
    setMaxPrice(100000);
    setSelectedModalities([]);
    setSelectedZones([]);
    setMinExperience(0);
    setSelectedGroupTypes([]);
  };

  const handleApply = () => {
    onApply({
      disciplines: selectedDisciplines,
      durations: selectedDurations,
      horarios: selectedHorarios,
      maxPrice,
      modalities: selectedModalities,
      zones: selectedZones,
      minExperience,
      groupTypes: selectedGroupTypes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 max-w-[430px] mx-auto">
      <div className="w-[85%] max-w-sm h-full bg-white flex flex-col justify-between shadow-2xl overflow-hidden animate-slide-left">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Filtros Avanzados</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ajustá tu búsqueda deportiva</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 no-scrollbar">
          
          {/* Disciplinas */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Disciplina</h3>
            <div className="flex flex-wrap gap-1">
              {ALL_DISCIPLINES.map(disc => {
                const active = selectedDisciplines.includes(disc);
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => toggleItem(selectedDisciplines, setSelectedDisciplines, disc)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-100 border-purple-300 text-[#7C3AED]" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rango de Precios */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Presupuesto Máximo</h3>
              <span className="font-bold text-[#7C3AED] text-xs">
                {maxPrice >= 100000 ? "Sin límite" : `$${maxPrice.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={100000}
              step={2000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#7C3AED] h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>$5.000 / mes</span>
              <span>$100.000+ / mes</span>
            </div>
          </div>

          {/* Modalidades */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Modalidad</h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MODALITIES.map(mod => {
                const active = selectedModalities.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleItem(selectedModalities, setSelectedModalities, mod)}
                    className={`px-3 py-2 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-50 border-purple-300 text-[#7C3AED]" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zonas Tags */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Zona de Cobertura</h3>
            <div className="flex flex-wrap gap-1">
              {ALL_ZONES.map(zone => {
                const active = selectedZones.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => toggleItem(selectedZones, setSelectedZones, zone)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-100 border-purple-300 text-[#7C3AED]" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Años de Experiencia */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Experiencia Mínima</h3>
              <span className="font-bold text-[#7C3AED] text-xs">
                {minExperience === 0 ? "Cualquiera" : `${minExperience} ${minExperience === 1 ? "año" : "años"}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={minExperience}
              onChange={(e) => setMinExperience(Number(e.target.value))}
              className="w-full accent-[#7C3AED] h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Principiante</span>
              <span>15+ años</span>
            </div>
          </div>

          {/* Duración sesión */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Duración de Sesión</h3>
            <div className="flex flex-wrap gap-1">
              {ALL_DURATIONS.map(dur => {
                const active = selectedDurations.includes(dur);
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => toggleItem(selectedDurations, setSelectedDurations, dur)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-100 border-purple-300 text-[#7C3AED]" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {dur}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Turno de Preferencia</h3>
            <div className="flex flex-wrap gap-1">
              {ALL_HOURS.map(hour => {
                const active = selectedHorarios.includes(hour);
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleItem(selectedHorarios, setSelectedHorarios, hour)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-100 border-purple-300 text-[#7C3AED]" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400">Grupal o Individual</h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_GROUP_TYPES.map(type => {
                const active = selectedGroupTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleItem(selectedGroupTypes, setSelectedGroupTypes, type)}
                    className={`px-3 py-2 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                      active 
                        ? "bg-purple-50 border-purple-300 text-[#7C3AED]" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <button
            onClick={handleClearAll}
            className="flex-1 py-3 px-1 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar Todo</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3 px-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer text-center"
            id="apply-filters-btn"
          >
            Aplicar Filtros
          </button>
        </div>

      </div>
    </div>
  );
};
