import React, { useState } from "react";
import { TrainerFields, FieldMap } from "../types";
import { Info, Sparkles, Upload, Link2, Eye, ShieldAlert, Check } from "lucide-react";

interface TrainerFormProps {
  initialValues?: Partial<TrainerFields>;
  onSubmit: (fields: Partial<TrainerFields>) => Promise<void>;
  submitLabel: string;
  isEditMode?: boolean;
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

export const TrainerForm: React.FC<TrainerFormProps> = ({
  initialValues = {},
  onSubmit,
  submitLabel,
  isEditMode = false
}) => {
  // State variables mapped to TrainerFields (using human tags but saving correct Field IDs)
  const [nombre, setNombre] = useState(initialValues[FieldMap.nombre] || "");
  const [email, setEmail] = useState(initialValues[FieldMap.email] || "");
  const [whatsapp, setWhatsapp] = useState(initialValues[FieldMap.whatsapp] || "");
  const [instagram, setInstagram] = useState(initialValues[FieldMap.instagram] || "");
  const [titulo, setTitulo] = useState(initialValues[FieldMap.tituloProfesional] || "");
  const [experience, setExperience] = useState<number>(initialValues[FieldMap.aniosExperiencia] || 1);
  const [bioProf, setBioProf] = useState(initialValues[FieldMap.bioProfesional] || "");
  const [bioPers, setBioPers] = useState(initialValues[FieldMap.bioPersonal] || "");
  const [frase, setFrase] = useState(initialValues[FieldMap.fraseEleccion] || "");
  
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(initialValues[FieldMap.disciplinas] || []);
  const [tagsServicios, setTagsServicios] = useState(initialValues[FieldMap.tagsServicios] || "");
  const [tagsPersonales, setTagsPersonales] = useState(initialValues[FieldMap.tagsPersonales] || "");
  const [zonaTexto, setZonaTexto] = useState(initialValues[FieldMap.zonaTexto] || "Gualeguaychú");
  const [selectedZones, setSelectedZones] = useState<string[]>(initialValues[FieldMap.zonasTags] || []);
  
  const [precioDesde, setPrecioDesde] = useState<number>(initialValues[FieldMap.precioDesde] || 10000);
  const [precioHasta, setPrecioHasta] = useState<number>(initialValues[FieldMap.precioHasta] || 25000);
  
  const [selectedDurations, setSelectedDurations] = useState<string[]>(initialValues[FieldMap.duracionSesion] || ["60 min"]);
  const [selectedHorarios, setSelectedHorarios] = useState<string[]>(initialValues[FieldMap.horarios] || ["Tarde"]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>(initialValues[FieldMap.modalidad] || ["Presencial"]);
  const [selectedGroupTypes, setSelectedGroupTypes] = useState<string[]>(initialValues[FieldMap.grupoIndividual] || ["Individual"]);
  
  const [fotoUrl, setFotoUrl] = useState(initialValues[FieldMap.fotoUrl] || "");
  const [uploadMethod, setUploadMethod] = useState<"link" | "upload">("link");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Base64 upload states
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Convert image file to base64 and upload to server
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setErrorMsg("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        // Post base64 data to our server
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            file: base64Data,
            filename: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          setFotoUrl(data.url);
          setSuccessMsg("¡Foto subida con éxito!");
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setErrorMsg("Error al subir el archivo al servidor.");
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setErrorMsg("Error al leer el archivo local.");
        setIsUploading(false);
      };
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al procesar tu foto.");
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate rules
    if (!nombre || !email || !titulo || !bioProf || !zonaTexto) {
      setErrorMsg("Por favor completa los campos obligatorios del perfil profesional.");
      return;
    }

    // Business rule: at least one contact channel is required
    if (!whatsapp && !instagram && !email) {
      setErrorMsg("Es obligatorio completar al menos un medio de contacto (WhatsApp, Instagram o Email) para que los clientes puedan agendar contigo.");
      return;
    }

    if (selectedDisciplines.length === 0) {
      setErrorMsg("Selecciona al menos una disciplina deportiva.");
      return;
    }

    if (precioDesde > precioHasta) {
      setErrorMsg("El precio 'desde' no puede ser mayor que el precio 'hasta'.");
      return;
    }

    setLoading(true);

    try {
      // Build fields according to Airtable format
      const formFields: Partial<TrainerFields> = {
        [FieldMap.nombre]: nombre,
        [FieldMap.email]: email,
        [FieldMap.whatsapp]: whatsapp,
        [FieldMap.instagram]: instagram,
        [FieldMap.tituloProfesional]: titulo,
        [FieldMap.aniosExperiencia]: Number(experience),
        [FieldMap.bioProfesional]: bioProf,
        [FieldMap.bioPersonal]: bioPers,
        [FieldMap.fraseEleccion]: frase,
        [FieldMap.disciplinas]: selectedDisciplines,
        [FieldMap.tagsServicios]: tagsServicios,
        [FieldMap.tagsPersonales]: tagsPersonales,
        [FieldMap.zonaTexto]: zonaTexto,
        [FieldMap.zonasTags]: selectedZones,
        [FieldMap.precioDesde]: Number(precioDesde),
        [FieldMap.precioHasta]: Number(precioHasta),
        [FieldMap.duracionSesion]: selectedDurations,
        [FieldMap.horarios]: selectedHorarios,
        [FieldMap.modalidad]: selectedModalities,
        [FieldMap.grupoIndividual]: selectedGroupTypes,
        [FieldMap.fotoUrl]: fotoUrl
      };

      await onSubmit(formFields);
      setSuccessMsg("¡Perfil guardado con éxito!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Ocurrió un error al guardar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6 text-xs text-slate-700">
      
      {/* Advise Banner */}
      <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex gap-2.5 items-start">
        <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#6D28D9] font-medium leading-relaxed">
          <strong>Consejo para entrenadores:</strong> "Los perfiles con más información reciben hasta 4x más consultas. Completá todos los campos que puedas."
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 text-rose-800 border border-rose-100 p-3 rounded-xl flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECCIÓN 1: Datos Básicos y Contacto */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
        <h3 className="font-bold text-[#7C3AED] text-sm border-b border-slate-100 pb-2">1. Datos Básicos y Contacto</h3>
        
        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Nombre Completo *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mariano 'Nano' Rodríguez"
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Email de contacto *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mariano@gmail.com"
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">WhatsApp (Celular) *</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="3446554433"
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
            />
            <span className="text-[9px] text-slate-400">Ingresar números sin espacios ni símbolos</span>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Usuario de Instagram (Opcional)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-bold">@</span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="mariano.fit"
              className="w-full border border-slate-200 rounded-lg p-2 pl-6 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Perfil Profesional */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
        <h3 className="font-bold text-[#7C3AED] text-sm border-b border-slate-100 pb-2">2. Perfil Profesional</h3>

        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Título o Especialidad Principal *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Lic. en Educación Física / Preparador Físico"
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Años de Experiencia *</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Ubicación (Texto Libre) *</label>
            <input
              type="text"
              value={zonaTexto}
              onChange={(e) => setZonaTexto(e.target.value)}
              placeholder="Ej: Plaza San Martín y Parque Unzué"
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              required
            />
          </div>
        </div>

        {/* Disciplinas Multiselect */}
        <div>
          <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Disciplinas Deportivas (Elegí tus áreas) *</label>
          <div className="flex flex-wrap gap-1">
            {ALL_DISCIPLINES.map(disc => {
              const active = selectedDisciplines.includes(disc);
              return (
                <button
                  type="button"
                  key={disc}
                  onClick={() => toggleItem(selectedDisciplines, setSelectedDisciplines, disc)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Zonas Tags Multiselect */}
        <div>
          <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Zonas de Cobertura en Gchu</label>
          <div className="flex flex-wrap gap-1">
            {ALL_ZONES.map(zone => {
              const active = selectedZones.includes(zone);
              return (
                <button
                  type="button"
                  key={zone}
                  onClick={() => toggleItem(selectedZones, setSelectedZones, zone)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Aranceles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Precio Desde ($) *</label>
            <input
              type="number"
              value={precioDesde}
              onChange={(e) => setPrecioDesde(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Precio Hasta ($) *</label>
            <input
              type="number"
              value={precioHasta}
              onChange={(e) => setPrecioHasta(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              required
            />
          </div>
        </div>

        {/* Bio Profesional */}
        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Biografía Profesional / Método de Trabajo *</label>
          <textarea
            value={bioProf}
            onChange={(e) => setBioProf(e.target.value)}
            placeholder="Escribí detalladamente tu experiencia, a quién entrenás, cómo planificás los entrenamientos, qué incluye tu tarifa..."
            rows={4}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50 resize-none leading-relaxed"
            required
          />
        </div>

        {/* Tags de Servicios */}
        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Tags de Servicios (Separados por coma)</label>
          <input
            type="text"
            value={tagsServicios}
            onChange={(e) => setTagsServicios(e.target.value)}
            placeholder="Ej: Musculación, Descenso de grasa, Rehabilitación, Clases a domicilio"
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
          />
        </div>
      </div>

      {/* SECCIÓN 3: Formato de Clases */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
        <h3 className="font-bold text-[#7C3AED] text-sm border-b border-slate-100 pb-2">3. Configuración de Clases</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Modalidades */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Modalidad</label>
            <div className="flex flex-col gap-1.5">
              {ALL_MODALITIES.map(mod => {
                const checked = selectedModalities.includes(mod);
                return (
                  <label key={mod} className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(selectedModalities, setSelectedModalities, mod)}
                      className="accent-[#7C3AED] w-3.5 h-3.5"
                    />
                    <span>{mod}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Formato de Clases</label>
            <div className="flex flex-col gap-1.5">
              {ALL_GROUP_TYPES.map(type => {
                const checked = selectedGroupTypes.includes(type);
                return (
                  <label key={type} className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(selectedGroupTypes, setSelectedGroupTypes, type)}
                      className="accent-[#7C3AED] w-3.5 h-3.5"
                    />
                    <span>{type}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Horarios */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Horarios Habituales</label>
            <div className="flex flex-col gap-1.5">
              {ALL_HOURS.map(hour => {
                const checked = selectedHorarios.includes(hour);
                return (
                  <label key={hour} className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(selectedHorarios, setSelectedHorarios, hour)}
                      className="accent-[#7C3AED] w-3.5 h-3.5"
                    />
                    <span>{hour}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px]">Duración de la Sesión</label>
            <div className="flex flex-col gap-1.5">
              {ALL_DURATIONS.map(dur => {
                const checked = selectedDurations.includes(dur);
                return (
                  <label key={dur} className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(selectedDurations, setSelectedDurations, dur)}
                      className="accent-[#7C3AED] w-3.5 h-3.5"
                    />
                    <span>{dur}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Perfil Personal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
        <h3 className="font-bold text-[#7C3AED] text-sm border-b border-slate-100 pb-2">4. Perfil Personal</h3>

        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Biografía Personal (Acerca de ti) *</label>
          <textarea
            value={bioPers}
            onChange={(e) => setBioPers(e.target.value)}
            placeholder="Contales quién sos fuera del gimnasio, tus pasatiempos, filosofía de vida, qué te inspira a entrenar..."
            rows={3}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50 resize-none leading-relaxed"
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Frase de Elección (Inspiradora o Lema)</label>
          <input
            type="text"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            placeholder="Ej: La consistencia siempre le gana al talento."
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Tags Personales / Intereses (Separados por coma)</label>
          <input
            type="text"
            value={tagsPersonales}
            onChange={(e) => setTagsPersonales(e.target.value)}
            placeholder="Ej: Empático, Organizado, Amante del café, Running entusiasta"
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
          />
        </div>
      </div>

      {/* SECCIÓN 5: Foto de Perfil */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-xs">
        <h3 className="font-bold text-[#7C3AED] text-sm border-b border-slate-100 pb-2">5. Foto de Perfil</h3>

        <div className="flex border-b border-slate-200 bg-slate-50 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setUploadMethod("link")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              uploadMethod === "link" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pegar Link Externo
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod("upload")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
              uploadMethod === "upload" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Subir Foto Directo
          </button>
        </div>

        {uploadMethod === "link" ? (
          <div>
            <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Enlace / URL de Foto</label>
            <div className="relative">
              <Link2 className="absolute top-2.5 left-2.5 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://ejemplo.com/mifoto.jpg"
                className="w-full border border-slate-200 rounded-lg p-2 pl-9 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none bg-slate-50"
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1 block leading-relaxed">
              Puedes pegar un link de tu foto de Instagram, Google Drive público, o cualquier servidor de imágenes externo.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block font-bold text-slate-600 uppercase text-[10px]">Seleccionar Archivo de Imagen</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-[#7C3AED] transition-colors rounded-xl p-4 text-center cursor-pointer relative bg-slate-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="file-photo-uploader"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold mb-1 text-xs">
                {isUploading ? "Procesando archivo..." : "Hacé click o arrastrá tu foto aquí"}
              </p>
              {fileName && <p className="text-[10px] text-slate-600 font-bold truncate mt-1">Archivo: {fileName}</p>}
            </div>
          </div>
        )}

        {fotoUrl && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
              <img src={fotoUrl} alt="Vista previa" referrerPolicy="no-referrer" className="w-full h-full object-cover object-top" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[10px] text-slate-500 uppercase">Vista previa cargada</p>
              <p className="text-[9px] text-slate-400 truncate mt-0.5">{fotoUrl}</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || isUploading}
        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        id="trainer-submit-btn"
      >
        {loading ? "Procesando..." : submitLabel}
      </button>
    </form>
  );
};
