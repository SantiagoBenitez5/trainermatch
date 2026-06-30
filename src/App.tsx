import React, { useState, useEffect } from "react";
import { TrainerRecord, TrainerFields, FieldMap } from "./types";
import { MOCK_TRAINERS } from "./mockData";
import { TrainerCard } from "./components/TrainerCard";
import { TrainerProfileView } from "./components/TrainerProfileView";
import { TrainerForm } from "./components/TrainerForm";
import { FiltersModal, FilterStates } from "./components/FiltersModal";
import { getFirebaseAuth, getGoogleProvider } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";
import { 
  Search, SlidersHorizontal, Heart, User, Sparkles, Activity, 
  Layers, LogOut, CheckCircle2, UserCheck, ShieldAlert, Plus, 
  MapPin, Eye, Phone, TrendingUp, Info, Upload, Check, Dumbbell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TrainerPanel from "./components/TrainerPanel";
import UserSpace from "./components/UserSpace";

const QUICK_CATEGORIES = ["Todos", "Gimnasio", "Running", "Funcional", "Yoga-Pilates", "Natacion", "Boxeo"];

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"inicio" | "buscar" | "guardados" | "miespacio" | "entrenador">("inicio");
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerRecord | null>(null);
  
  // Data State
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "offline">("connected");
  
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("trainermatch_favs");
    return saved ? JSON.parse(saved) : [];
  });

  // Auth State (Combined Real Firebase and Interactive Mock Fallback)
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; isMock?: boolean } | null>(null);
  
  // Trainer Profile Dashboard State
  const [myProfile, setMyProfile] = useState<TrainerRecord | null>(null);
  const [loadingMyProfile, setLoadingMyProfile] = useState(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<"panel" | "preview" | "edit" | "verif">("panel");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterStates>({
    disciplines: [],
    durations: [],
    horarios: [],
    maxPrice: 100000,
    modalities: [],
    zones: [],
    minExperience: 0,
    groupTypes: []
  });

  // Verification request state
  const [verifDocType, setVerifDocType] = useState<"Foto personal" | "Diploma de curso" | "Titulo universitario" | "Otro">("Foto personal");
  const [verifDocFile, setVerifDocFile] = useState("");
  const [verifSubmitting, setVerifSubmitting] = useState(false);
  const [verifSuccess, setVerifSuccess] = useState(false);

  // Initialize Auth & Load Trainers
  useEffect(() => {
    // 1. Firebase Auth listener setup
    const auth = getFirebaseAuth();
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user && !currentUser?.isMock) {
          setCurrentUser({ uid: user.uid, email: user.email || "" });
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser?.isMock]);

  // Load public trainers from server (or fallback to mockup if server is unreachable)
  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trainers");
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setTrainers(data.records);
          setConnectionStatus("connected");
        } else {
          // If connection works but Airtable has 0 active, load the 5 mockups
          setTrainers(MOCK_TRAINERS);
        }
      } else {
        throw new Error("Server responded with error status");
      }
    } catch (err) {
      console.warn("Airtable not fully initialized. Operating in local demo-mode with pre-loaded profiles.", err);
      setConnectionStatus("offline");
      setTrainers(MOCK_TRAINERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  // Sync Favorites to Local Storage
  useEffect(() => {
    localStorage.setItem("trainermatch_favs", JSON.stringify(favorites));
  }, [favorites]);

  // Load Trainer's Own Profile if Logged In
  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!currentUser) {
        setMyProfile(null);
        return;
      }

      try {
        setLoadingMyProfile(true);
        // Attempt to fetch profile associated with current Firebase UID
        const res = await fetch(`/api/trainers?uid=${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.records && data.records.length > 0) {
            setMyProfile(data.records[0]);
          } else if (currentUser.isMock) {
            // For mock demo, if profile is missing, simulate profile loading of Clara
            const claraProfile = MOCK_TRAINERS.find(t => t.fields[FieldMap.firebaseUid] === "mockUidClara");
            if (claraProfile) {
              setMyProfile({
                ...claraProfile,
                fields: {
                  ...claraProfile.fields,
                  [FieldMap.firebaseUid]: currentUser.uid,
                  [FieldMap.email]: currentUser.email
                }
              });
            }
          } else {
            setMyProfile(null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingMyProfile(false);
      }
    };

    fetchMyProfile();
  }, [currentUser]);

  // Auth Operations
  const handleGoogleLogin = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Fallback: Login instantly using interactive mock
      handleMockTrainerLogin();
      return;
    }
    try {
      const provider = getGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setCurrentUser({ uid: result.user.uid, email: result.user.email || "" });
      }
    } catch (err) {
      console.warn("Auth popup blocked or configuration missing. Triggering safe interactive fallback.", err);
      handleMockTrainerLogin();
    }
  };

  const handleMockTrainerLogin = () => {
    // Instant interactive mock login so trainers can test profile management in iframe immediately
    setCurrentUser({
      uid: "mockTrainerUid123",
      email: "entrenador.prueba@trainermatch.com",
      isMock: true
    });
  };

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    if (auth && !currentUser?.isMock) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setMyProfile(null);
    setActiveTab("inicio");
  };

  // Profile Operations (CRUD)
  const handleRegisterTrainer = async (fields: Partial<TrainerFields>) => {
    if (!currentUser) return;

    // Inject UID
    fields[FieldMap.firebaseUid] = currentUser.uid;

    const res = await fetch("/api/trainers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    });

    if (res.ok) {
      const newRecord = await res.json();
      setMyProfile(newRecord);
      // Reload trainers to reflect change
      fetchTrainers();
    } else {
      const errText = await res.text();
      throw new Error(errText);
    }
  };

  const handleEditTrainer = async (fields: Partial<TrainerFields>) => {
    if (!myProfile || !currentUser) return;

    const res = await fetch(`/api/trainers/${myProfile.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields, userUid: currentUser.uid })
    });

    if (res.ok) {
      const updatedRecord = await res.json();
      setMyProfile(updatedRecord);
      fetchTrainers();
    } else {
      const errText = await res.text();
      throw new Error(errText);
    }
  };

  const handleToggleActiveState = async () => {
    if (!myProfile || !currentUser) return;
    const currentEstado = myProfile.fields[FieldMap.estado];
    const newEstado = currentEstado === "Activo" ? "Pausado" : "Activo";

    try {
      const res = await fetch(`/api/trainers/${myProfile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            [FieldMap.estado]: newEstado
          },
          userUid: currentUser.uid
        })
      });

      if (res.ok) {
        const updatedRecord = await res.json();
        setMyProfile(updatedRecord);
        fetchTrainers();
      }
    } catch (err) {
      console.error("Error toggling active state:", err);
    }
  };

  // Verification request
  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64Data, filename: file.name })
        });
        if (res.ok) {
          const data = await res.json();
          setVerifDocFile(data.url);
        }
      };
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfile || !verifDocFile) return;

    try {
      setVerifSubmitting(true);
      const res = await fetch("/api/verificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "fldD1AiTlGnoTIPUa": myProfile.fields[FieldMap.email], // Trainer_Email
            "fldMuXlDvPxwqgLmU": verifDocType, // Tipo_Documento
          }
        })
      });

      if (res.ok) {
        setVerifSuccess(true);
        setVerifDocFile("");
        setTimeout(() => setVerifSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifSubmitting(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation(); // prevent opening details page
    if (favorites.includes(recordId)) {
      setFavorites(favorites.filter(id => id !== recordId));
    } else {
      setFavorites([...favorites, recordId]);
    }
  };

  // Filter Combiner
  const filteredTrainers = trainers.filter((trainer) => {
    const fields = trainer.fields;
    
    // 1. Search Query (matches name, title, or tags)
    const name = (fields[FieldMap.nombre] || "").toLowerCase();
    const title = (fields[FieldMap.tituloProfesional] || "").toLowerCase();
    const serviceTags = (fields[FieldMap.tagsServicios] || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    
    const matchesSearch = !q || name.includes(q) || title.includes(q) || serviceTags.includes(q);

    // 2. Quick Category
    const trainerDisciplines = fields[FieldMap.disciplinas] || [];
    const matchesCategory = selectedCategory === "Todos" || trainerDisciplines.includes(selectedCategory);

    // 3. Advanced Filters
    const matchesAdvDisciplines = filters.disciplines.length === 0 || 
      filters.disciplines.some(disc => trainerDisciplines.includes(disc));

    const trainerDurations = fields[FieldMap.duracionSesion] || [];
    const matchesAdvDurations = filters.durations.length === 0 || 
      filters.durations.some(dur => trainerDurations.includes(dur));

    const trainerHorarios = fields[FieldMap.horarios] || [];
    const matchesAdvHorarios = filters.horarios.length === 0 || 
      filters.horarios.some(hour => trainerHorarios.includes(hour));

    const priceMin = fields[FieldMap.precioDesde] || 0;
    const matchesPrice = priceMin <= filters.maxPrice;

    const trainerModalities = fields[FieldMap.modalidad] || [];
    const matchesModalities = filters.modalities.length === 0 || 
      filters.modalities.some(mod => trainerModalities.includes(mod));

    const trainerZones = fields[FieldMap.zonasTags] || [];
    const matchesZones = filters.zones.length === 0 || 
      filters.zones.some(zone => trainerZones.includes(zone));

    const trainerExperience = fields[FieldMap.aniosExperiencia] || 0;
    const matchesExperience = trainerExperience >= filters.minExperience;

    const trainerGroupTypes = fields[FieldMap.grupoIndividual] || [];
    const matchesGroupTypes = filters.groupTypes.length === 0 || 
      filters.groupTypes.some(type => trainerGroupTypes.includes(type));

    return (
      matchesSearch &&
      matchesCategory &&
      matchesAdvDisciplines &&
      matchesAdvDurations &&
      matchesAdvHorarios &&
      matchesPrice &&
      matchesModalities &&
      matchesZones &&
      matchesExperience &&
      matchesGroupTypes
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row justify-center items-stretch overflow-x-hidden">
      
      {/* LEFT COLUMN: Premium Desktop Landing Card & Guidance Info */}
      <div className="hidden md:flex flex-col justify-between p-8 lg:p-12 max-w-lg shrink-0 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider text-[#A78BFA] uppercase leading-none">Entre Ríos • Gchu</span>
              <h1 className="text-xl font-extrabold text-white tracking-tight">TrainerMatch</h1>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white leading-tight">Directorio Verificado de Personal Trainers</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              TrainerMatch conecta deportistas locales con entrenadores profesionales en Gualeguaychú. 
              Buscá por disciplina, modalidad de clase, rangos de precios o zona geográfica de manera estructurada.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Base Airtable Integrada</span>
              </div>
              <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded">ID: apps9X5...</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              La plataforma lee y escribe directamente en la base de Airtable proporcionada. 
              Para registrarte como preparador físico, andá a la pestaña <strong>Soy Entrenador</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 space-y-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Info className="w-4 h-4 text-[#7C3AED]" />
            <span>Credenciales de Test Rápido</span>
          </div>
          <p className="leading-relaxed">
            Hacé click en "Soy Entrenador" para simular un inicio de sesión instantáneo y probar el panel de control (creación de perfil, subida de fotos, activación/pausa y carga de títulos) sin configurar claves adicionales.
          </p>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            © 2026 TrainerMatch Gchu. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Centered Mobile Device Frame Mockup (430px limit) */}
      <div className="flex-1 flex justify-center items-center p-0 sm:p-4 bg-slate-950">
        
        {/* The Mobile Shell Frame */}
        <div className="w-full max-w-[430px] h-[100vh] sm:h-[880px] sm:max-h-[92vh] bg-white text-slate-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border-0 sm:border-8 border-slate-800 flex flex-col relative">
          
          {/* Top Status Notch / Bar Simulation */}
          <div className="bg-slate-900 text-slate-300 px-5 py-2.5 flex justify-between items-center text-[10px] font-bold select-none shrink-0">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#A78BFA]" />
              <span>TrainerMatch Gualeguaychú</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              <span className="text-slate-400 font-mono">{connectionStatus === "connected" ? "Base Airtable Activa" : "Modo Fallback local"}</span>
            </div>
          </div>

          {/* Core Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50">
            
            {/* View Switching Logic */}
            {selectedTrainer ? (
              // PUBLIC TRAINER PROFILE VIEW
              <TrainerProfileView
                trainer={selectedTrainer}
                onBack={() => setSelectedTrainer(null)}
                isFavorite={favorites.includes(selectedTrainer.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              // BOTTOM NAVIGATION TABS VIEWS
              <>
                {activeTab === "inicio" && (
                  <div className="p-4 space-y-4 pb-20">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
                          TrainerMatch <span className="text-[#7C3AED]">⚡</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">Buscá tu entrenador ideal</p>
                      </div>
                      <div className="p-2 bg-purple-50 text-[#7C3AED] rounded-lg text-[10px] font-bold">
                        Gualeguaychú
                      </div>
                    </div>

                    {/* Search & Filters Toggle bar */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-2.5 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscá entrenador o disciplina..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#7C3AED] focus:outline-none focus:border-[#7C3AED] shadow-xs"
                          id="search-input"
                        />
                      </div>
                      <button
                        onClick={() => setIsFilterOpen(true)}
                        className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-slate-600 shadow-xs relative cursor-pointer"
                        id="advanced-filters-btn"
                        title="Filtros Avanzados"
                      >
                        <SlidersHorizontal className="w-5 h-5 text-[#7C3AED]" />
                        {Object.values(filters).some(x => Array.isArray(x) ? x.length > 0 : x !== 100000 && x !== 0) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                      </button>
                    </div>

                    {/* Quick Filters Horizontal Scrolling Chips */}
                    <div className="overflow-x-auto flex gap-1.5 py-1 no-scrollbar -mx-4 px-4">
                      {QUICK_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                            selectedCategory === cat
                              ? "bg-[#7C3AED] text-white shadow-sm"
                              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-100/60"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Feed Loading & List of Cards */}
                    {loading ? (
                      <div className="py-20 text-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#7C3AED] animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-400">Cargando entrenadores verificados...</p>
                      </div>
                    ) : filteredTrainers.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
                        <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-700 text-sm">Sin resultados</h4>
                        <p className="text-xs text-slate-400 mt-1">Prueba quitando algún filtro avanzado o modificando la búsqueda.</p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("Todos");
                            setFilters({
                              disciplines: [],
                              durations: [],
                              horarios: [],
                              maxPrice: 100000,
                              modalities: [],
                              zones: [],
                              minExperience: 0,
                              groupTypes: []
                            });
                          }}
                          className="mt-4 bg-purple-50 text-[#7C3AED] text-xs font-bold px-4 py-2 rounded-lg"
                        >
                          Restablecer búsqueda
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                          <span>Entrenadores Activos ({filteredTrainers.length})</span>
                          <span>Gualeguaychú</span>
                        </div>
                        {filteredTrainers.map((trainer) => (
                          <TrainerCard
                            key={trainer.id}
                            trainer={trainer}
                            onViewProfile={setSelectedTrainer}
                            isFavorite={favorites.includes(trainer.id)}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "buscar" && (
                  <div className="p-4 space-y-4 pb-20">
                    <h2 className="text-lg font-extrabold text-slate-800">Filtros Activos</h2>
                    <p className="text-xs text-slate-500">Configura de manera directa la búsqueda avanzada.</p>
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="w-full bg-[#7C3AED] text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-purple-200 cursor-pointer text-center"
                    >
                      Configurar Filtros Avanzados
                    </button>
                  </div>
                )}

                {activeTab === "guardados" && (
                  <div className="p-4 space-y-4 pb-20">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800">Mis Favoritos</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Entrenadores guardados en este dispositivo</p>
                    </div>

                    {favorites.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
                        <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-700 text-sm">Sin guardados</h4>
                        <p className="text-xs text-slate-400 mt-1">Hacé click en el corazón de cualquier tarjeta de entrenador para guardarlo acá.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {trainers
                          .filter((t) => favorites.includes(t.id))
                          .map((trainer) => (
                            <TrainerCard
                              key={trainer.id}
                              trainer={trainer}
                              onViewProfile={setSelectedTrainer}
                              isFavorite={true}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "miespacio" && (
                  <div className="p-4 space-y-4 pb-20">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-800">Mi Espacio</h2>
                        <p className="text-[11px] text-slate-500 font-medium">Tu agenda, entrenamientos y pagos</p>
                      </div>
                    </div>

                    {!currentUser ? (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-4 shadow-xs">
                        <div className="w-12 h-12 bg-purple-50 text-[#7C3AED] rounded-full flex items-center justify-center mx-auto">
                          <Activity className="w-6 h-6 animate-pulse" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Registrate o Iniciá Sesión</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Iniciá sesión para agendar tus clases con entrenadores de Gualeguaychú, registrar tus progresos de entrenamiento, y realizar el seguimiento de tus pagos.
                        </p>

                        <div className="space-y-2 pt-2">
                          <button
                            onClick={handleGoogleLogin}
                            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            id="btn-login-google-user"
                          >
                            <Sparkles className="w-4 h-4 fill-white" />
                            <span>Ingresar con Google</span>
                          </button>
                          
                          <button
                            onClick={handleMockTrainerLogin}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all text-center block cursor-pointer"
                            id="btn-login-mock-user"
                          >
                            Simular Ingreso (Test Rápido)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Auth Status Banner */}
                        <div className="bg-slate-800 text-white p-3.5 rounded-xl flex justify-between items-center shadow-sm">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-purple-400 uppercase">Espacio Deportista</span>
                            <p className="text-xs font-bold truncate text-slate-100">{currentUser.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                            title="Cerrar Sesión"
                            id="logout-btn-user"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>

                        <UserSpace 
                          currentUser={currentUser} 
                          trainers={trainers}
                          onNavigateToInicio={() => setActiveTab("inicio")}
                          onViewTrainerProfile={setSelectedTrainer}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "entrenador" && (
                  <div className="p-4 space-y-4 pb-20">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-800">Sección Entrenador</h2>
                        <p className="text-[11px] text-slate-500 font-medium">Administrá tu perfil público</p>
                      </div>
                    </div>

                    {/* Authentication Logic Guard */}
                    {!currentUser ? (
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-4 shadow-xs">
                        <div className="w-12 h-12 bg-purple-50 text-[#7C3AED] rounded-full flex items-center justify-center mx-auto">
                          <User className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Registrate o Iniciá Sesión</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Si eres profesor o personal trainer, inicia sesión para crear o editar tu perfil profesional en TrainerMatch y recibir consultas directas por WhatsApp e Instagram.
                        </p>

                        <div className="space-y-2 pt-2">
                          <button
                            onClick={handleGoogleLogin}
                            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            id="btn-login-google"
                          >
                            <Sparkles className="w-4 h-4 fill-white" />
                            <span>Ingresar con Google</span>
                          </button>
                          
                          <button
                            onClick={handleMockTrainerLogin}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all text-center block cursor-pointer"
                            id="btn-login-mock"
                          >
                            Simular Ingreso (Test Rápido)
                          </button>
                        </div>
                      </div>
                    ) : (
                      // TRAINER DASHBOARD / REGISTRATION FORM (IF LOGGED IN)
                      <div className="space-y-4">
                        
                        {/* Auth Status Banner */}
                        <div className="bg-slate-800 text-white p-3.5 rounded-xl flex justify-between items-center shadow-sm">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-purple-400 uppercase">Suscripción Activa</span>
                            <p className="text-xs font-bold truncate text-slate-100">{currentUser.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                            title="Cerrar Sesión"
                            id="logout-btn"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>

                        {loadingMyProfile ? (
                          <div className="py-12 text-center">
                            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs text-slate-400">Verificando perfil en la base de datos...</p>
                          </div>
                        ) : !myProfile ? (
                          // ONBOARDING REGISTRATION FORM (WIZARD)
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
                              <h3 className="font-extrabold text-slate-800 text-sm">Creá tu Perfil de Entrenador</h3>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Completa el formulario con tu información real. Al finalizar el registro, tu perfil quedará en estado <strong>Pendiente</strong> de verificación por parte del administrador.
                              </p>
                            </div>
                            <TrainerForm
                              onSubmit={handleRegisterTrainer}
                              submitLabel="Crear Perfil Profesional"
                            />
                          </div>
                        ) : (
                          // TRAINER PROFILE INSTALLED - DASHBOARD PANEL
                          <div className="space-y-4">
                            
                            {/* Profile State Switcher */}
                            <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado del Perfil</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`w-2 h-2 rounded-full ${myProfile.fields[FieldMap.estado] === "Activo" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                                  <span className="font-bold text-xs text-slate-800">{myProfile.fields[FieldMap.estado]}</span>
                                </div>
                              </div>
                              <button
                                onClick={handleToggleActiveState}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                                  myProfile.fields[FieldMap.estado] === "Activo"
                                    ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                                    : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                }`}
                                id="toggle-active-btn"
                              >
                                {myProfile.fields[FieldMap.estado] === "Activo" ? "Pausar Perfil" : "Activar Perfil"}
                              </button>
                            </div>

                            {/* Simulated Stats Panel */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Vistas de Perfil</span>
                                <p className="text-lg font-extrabold text-slate-800 mt-1">214 <span className="text-[10px] text-emerald-500 font-bold font-mono">+12%</span></p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Clicks WhatsApp</span>
                                <p className="text-lg font-extrabold text-[#7C3AED] mt-1">38 <span className="text-[10px] text-emerald-500 font-bold font-mono">+5%</span></p>
                              </div>
                            </div>

                            {/* Subtabs switches */}
                            <div className="flex border-b border-slate-200 bg-slate-100/80 rounded-lg p-0.5">
                              <button
                                onClick={() => setDashboardSubTab("panel")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  dashboardSubTab === "panel" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Mi Panel
                              </button>
                              <button
                                onClick={() => setDashboardSubTab("preview")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  dashboardSubTab === "preview" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Vista Previa
                              </button>
                              <button
                                onClick={() => setDashboardSubTab("edit")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  dashboardSubTab === "edit" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Editar Datos
                              </button>
                              <button
                                onClick={() => setDashboardSubTab("verif")}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  dashboardSubTab === "verif" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                Verificación
                              </button>
                            </div>

                            {/* Content of Subtabs */}
                            {dashboardSubTab === "panel" && (
                              <TrainerPanel currentUser={currentUser} myProfile={myProfile} />
                            )}

                            {dashboardSubTab === "preview" && (
                              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[460px] overflow-y-auto">
                                <div className="p-3 bg-purple-50 text-slate-600 text-[10px] font-bold flex items-center gap-1 border-b border-purple-100">
                                  <Info className="w-3.5 h-3.5 text-[#7C3AED]" />
                                  <span>Así se ve tu perfil públicamente para los clientes:</span>
                                </div>
                                <TrainerProfileView
                                  trainer={myProfile}
                                  onBack={() => {}}
                                  isFavorite={false}
                                  onToggleFavorite={() => {}}
                                />
                              </div>
                            )}

                            {dashboardSubTab === "edit" && (
                              <div className="bg-slate-50 rounded-xl p-1">
                                <TrainerForm
                                  initialValues={myProfile.fields}
                                  onSubmit={handleEditTrainer}
                                  submitLabel="Guardar Cambios"
                                  isEditMode={true}
                                />
                              </div>
                            )}

                            {dashboardSubTab === "verif" && (
                              <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4 shadow-xs">
                                <h3 className="font-bold text-slate-800 text-sm">Subir Documentación de Verificación</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Sube fotos de tu DNI o diploma académico para que el administrador verifique tu nivel. Esto te otorgará insignias visuales (Insignia de Título, Instructora Certificada o Básico) que generan hasta 3x más confianza en los clientes de la región.
                                </p>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nivel actual</span>
                                  <p className="font-extrabold text-slate-800 mt-0.5">
                                    {myProfile.fields[FieldMap.nivelVerificacion] || "Sin verificar"}
                                  </p>
                                </div>

                                <form onSubmit={handleSubmitVerification} className="space-y-4 pt-2">
                                  {verifSuccess && (
                                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                      <span>Solicitud de verificación enviada con éxito. El administrador revisará tu diploma a la brevedad.</span>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Tipo de Documento</label>
                                    <select
                                      value={verifDocType}
                                      onChange={(e) => setVerifDocType(e.target.value as any)}
                                      className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                                    >
                                      <option value="Foto personal">Foto personal (Para badge Básico)</option>
                                      <option value="Diploma de curso">Diploma de curso (Para badge Curso Certificado)</option>
                                      <option value="Titulo universitario">Título universitario (Para badge Universitario)</option>
                                      <option value="Otro">Otro documento de respaldo</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block font-bold text-slate-600 mb-1 uppercase text-[10px]">Cargar Foto del Documento</label>
                                    <div className="border-2 border-dashed border-slate-200 hover:border-[#7C3AED] transition-all rounded-xl p-4 text-center cursor-pointer relative bg-slate-50">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadDoc}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                      <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                                      <p className="text-slate-500 font-semibold text-xs">Hacé click o arrastrá el archivo</p>
                                    </div>
                                    {verifDocFile && (
                                      <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Documento cargado correctamente.
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={verifSubmitting || !verifDocFile}
                                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
                                  >
                                    {verifSubmitting ? "Enviando solicitud..." : "Enviar a revisión"}
                                  </button>
                                </form>
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    )}

                  </div>
                )}
              </>
            )}

          </div>

          {/* Bottom App-Like Navigation Menu (Persists at bottom of mockup) */}
          <div className="h-16 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-stretch z-30 shrink-0 shadow-lg relative max-w-[430px] mx-auto w-full select-none">
            <button
              onClick={() => {
                setSelectedTrainer(null);
                setActiveTab("inicio");
              }}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                activeTab === "inicio" && !selectedTrainer ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-home"
            >
              <Activity className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">Inicio</span>
            </button>

            <button
              onClick={() => {
                setSelectedTrainer(null);
                setActiveTab("buscar");
                setIsFilterOpen(true);
              }}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                activeTab === "buscar" && !selectedTrainer ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-search"
            >
              <Search className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">Buscar</span>
            </button>

            <button
              onClick={() => {
                setSelectedTrainer(null);
                setActiveTab("guardados");
              }}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                activeTab === "guardados" && !selectedTrainer ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-saved"
            >
              <Heart className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">Guardados</span>
            </button>

            <button
              onClick={() => {
                setSelectedTrainer(null);
                setActiveTab("miespacio");
              }}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                activeTab === "miespacio" && !selectedTrainer ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-user-space"
            >
              <Dumbbell className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">Mi Espacio</span>
            </button>

            <button
              onClick={() => {
                setSelectedTrainer(null);
                setActiveTab("entrenador");
              }}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                activeTab === "entrenador" && !selectedTrainer ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-trainer"
            >
              <User className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-bold">Soy Entrenador</span>
            </button>
          </div>

          {/* Advanced Filters Slide-Up Drawer Drawer */}
          <AnimatePresence>
            {isFilterOpen && (
              <FiltersModal
                currentFilters={filters}
                onClose={() => setIsFilterOpen(false)}
                onApply={(appliedFilters) => {
                  setFilters(appliedFilters);
                  setIsFilterOpen(false);
                  setActiveTab("inicio");
                }}
              />
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
