import React, { useState, useEffect } from "react";
import { TrainerRecord, ReviewRecord, ReviewFields, FieldMap } from "../types";
import { 
  ArrowLeft, Star, Heart, MapPin, Clock, Calendar, Users, 
  DollarSign, Mail, Phone, ExternalLink, Send, ShieldCheck, 
  Award, CheckCircle2, MessageSquare, AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

interface TrainerProfileViewProps {
  trainer: TrainerRecord;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, recordId: string) => void;
}

export const TrainerProfileView: React.FC<TrainerProfileViewProps> = ({
  trainer,
  onBack,
  isFavorite,
  onToggleFavorite
}) => {
  const fields = trainer.fields;
  const trainerEmail = fields[FieldMap.email];
  const trainerName = fields[FieldMap.nombre];

  const [activeTab, setActiveTab] = useState<"profesional" | "personal">("profesional");
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  
  // New Review Form State
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Fetch Reviews on mount or email change
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`/api/resenas?email=${encodeURIComponent(trainerEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.records || []);
        } else {
          console.error("Failed to load reviews from server");
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (trainerEmail) {
      fetchReviews();
    }
  }, [trainerEmail]);

  // Handle submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !reviewText) {
      setReviewError("Por favor completa tu nombre y el comentario de tu reseña.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      
      const newReviewFields: ReviewFields = {
        "fldC2Nz3Xl9wFn5gB": trainerEmail, // Trainer_Email
        "fldM8t01Bl8uW6yGT": clientName, // Nombre_Cliente
        "fldpFRTE0YZ0Hdf6R": rating, // Calificacion
        "fldSMboq3LUzHMvjz": reviewText, // Texto
      };

      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: newReviewFields })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        setClientName("");
        setReviewText("");
        setRating(5);
        
        // Prepend review locally to the UI
        setReviews(prev => [data, ...prev]);
        
        setTimeout(() => setReviewSuccess(false), 5000);
      } else {
        const errText = await res.text();
        setReviewError(`No se pudo enviar la reseña: ${errText}`);
      }
    } catch (err: any) {
      setReviewError(`Error: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Profile fields mapping
  const title = fields[FieldMap.tituloProfesional] || "Coach Deportivo";
  const experience = fields[FieldMap.aniosExperiencia] || 0;
  const ratingAvg = fields[FieldMap.calificacion] || 5.0;
  const totalReviews = fields[FieldMap.totalResenas] || 0;
  const bioProfesional = fields[FieldMap.bioProfesional] || "Sin biografía profesional cargada.";
  const bioPersonal = fields[FieldMap.bioPersonal] || "Sin biografía personal cargada.";
  const fraseEleccion = fields[FieldMap.fraseEleccion] || "";
  const zoneText = fields[FieldMap.zonaTexto] || "Gualeguaychú";
  const zonesTags = fields[FieldMap.zonasTags] || [];
  const priceMin = fields[FieldMap.precioDesde] || 0;
  const priceMax = fields[FieldMap.precioHasta] || 0;
  const durations = fields[FieldMap.duracionSesion] || [];
  const times = fields[FieldMap.horarios] || [];
  const modalities = fields[FieldMap.modalidad] || [];
  const groupings = fields[FieldMap.grupoIndividual] || [];
  const disciplines = fields[FieldMap.disciplinas] || [];
  
  const tagsServicios = fields[FieldMap.tagsServicios] 
    ? fields[FieldMap.tagsServicios].split(",").map(s => s.trim()).filter(Boolean) 
    : [];
  const tagsPersonales = fields[FieldMap.tagsPersonales] 
    ? fields[FieldMap.tagsPersonales].split(",").map(s => s.trim()).filter(Boolean) 
    : [];

  const whatsapp = fields[FieldMap.whatsapp];
  const instagram = fields[FieldMap.instagram];
  const verifLevel = fields[FieldMap.nivelVerificacion] || "Sin verificar";

  // Photo URL builder
  let imageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400";
  const attachments = fields[FieldMap.fotoAttachment];
  const directUrl = fields[FieldMap.fotoUrl];
  if (attachments && attachments.length > 0) {
    imageUrl = attachments[0].url;
  } else if (directUrl) {
    imageUrl = directUrl;
  }

  // Pre-armed WhatsApp Link
  const encodedMsg = encodeURIComponent(`Hola ${trainerName}! Te encontré en TrainerMatch y me interesa saber más sobre tus sesiones.`);
  const waUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodedMsg}` : null;
  const igUrl = instagram ? `https://instagram.com/${instagram.replace(/@/g, "")}` : null;
  const mailUrl = trainerEmail ? `mailto:${trainerEmail}` : null;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-28">
      {/* Cover / Header Section */}
      <div className="relative h-64 w-full bg-slate-800">
        <img
          src={imageUrl}
          alt={trainerName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-90 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full transition-colors"
            id="profile-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => onToggleFavorite(e, trainer.id)}
            className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full transition-colors"
            id="profile-fav-btn"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "text-rose-500 fill-rose-500" : "text-white"}`} />
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            {verifLevel === "Titulo universitario" && (
              <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Título Univ. Verificado</span>
              </span>
            )}
            {verifLevel === "Curso certificado" && (
              <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <Award className="w-3.5 h-3.5" />
                <span>Curso Certificado</span>
              </span>
            )}
            {verifLevel === "Basico" && (
              <span className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Perfil Básico Verificado</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-md">{trainerName}</h1>
          <p className="text-sm text-slate-200 mt-0.5 font-medium drop-shadow-xs">{title}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-100">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 shrink-0" />
              <span className="font-bold text-white text-sm">{ratingAvg.toFixed(1)}</span>
              <span className="text-slate-300">({totalReviews || reviews.length} reseñas)</span>
            </div>
            <span className="text-slate-300">•</span>
            <span>{experience} {experience === 1 ? "año" : "años"} exp.</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <button
          onClick={() => setActiveTab("profesional")}
          className={`flex-1 py-3.5 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === "profesional"
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-profesional"
        >
          Perfil Profesional
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex-1 py-3.5 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === "personal"
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-personal"
        >
          Pestaña Personal
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="p-4 flex-1">
        {activeTab === "profesional" ? (
          <div className="space-y-5">
            {/* Disciplinas Badges */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Especialidades</h3>
              <div className="flex flex-wrap gap-1.5">
                {disciplines.map(disc => (
                  <span key={disc} className="bg-purple-50 text-[#7C3AED] text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-100/50">
                    {disc}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio Profesional */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Biografía Profesional</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{bioProfesional}</p>
            </div>

            {/* Info Práctica */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Información de Sesión</h3>
              
              <div className="grid grid-cols-1 gap-3.5 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Ubicación y Zona</p>
                    <p className="text-xs text-slate-500 mt-0.5">{zoneText}</p>
                    {zonesTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {zonesTags.map(tag => (
                          <span key={tag} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-semibold">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Aranceles y Planes</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rango estimado: <span className="font-semibold text-slate-800">${priceMin.toLocaleString()} - ${priceMax.toLocaleString()} / mes</span>
                    </p>
                  </div>
                </div>

                {durations.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Duración Promedio</p>
                      <p className="text-xs text-slate-500 mt-0.5">{durations.join(", ")}</p>
                    </div>
                  </div>
                )}

                {times.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Horarios Disponibles</p>
                      <p className="text-xs text-slate-500 mt-0.5">{times.join(", ")}</p>
                    </div>
                  </div>
                )}

                {modalities.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Modalidad</p>
                      <p className="text-xs text-slate-500 mt-0.5">{modalities.join(" / ")}</p>
                    </div>
                  </div>
                )}

                {groupings.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-[#7C3AED]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Formato</p>
                      <p className="text-xs text-slate-500 mt-0.5">{groupings.join(" y ")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags de Servicios */}
            {tagsServicios.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Servicios Ofrecidos</h3>
                <div className="flex flex-wrap gap-1">
                  {tagsServicios.map(tag => (
                    <span key={tag} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                Reseñas de Clientes ({reviews.length})
              </h3>

              {loadingReviews ? (
                <div className="py-4 text-center text-xs text-slate-400">Cargando opiniones reales...</div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 italic text-center">Este entrenador aún no tiene reseñas verificadas. ¡Sé el primero en calificarlo!</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {reviews.map(review => {
                    const revFields = review.fields;
                    const cName = revFields["fldM8t01Bl8uW6yGT"] || "Cliente Anónimo";
                    const score = revFields["fldpFRTE0YZ0Hdf6R"] || 5;
                    const rText = revFields["fldSMboq3LUzHMvjz"] || "";
                    const rDate = revFields["fldVBQmNBdjYbeFJa"] || "Reciente";

                    return (
                      <div key={review.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-800">{cName}</p>
                          <span className="text-[10px] text-slate-400">{rDate}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400 my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">{rText}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit Review Form */}
              <form onSubmit={handleSubmitReview} className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Dejar una Reseña</h4>
                
                {reviewSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>¡Gracias! Tu reseña ha sido enviada con éxito.</span>
                  </div>
                )}
                {reviewError && (
                  <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tu Nombre</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej: Sofía L."
                      className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Calificación</label>
                    <div className="flex items-center gap-1 mt-1 text-slate-300">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRating(val)}
                          className={`p-0.5 hover:scale-110 transition-transform ${val <= rating ? "text-amber-400" : "text-slate-300"}`}
                        >
                          <Star className={`w-5 h-5 ${val <= rating ? "fill-amber-400" : ""}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tu Experiencia</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Contale a otros cómo fue tu experiencia entrenando con este coach..."
                    rows={3}
                    className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] bg-slate-50 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-[#7C3AED] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#6D28D9] active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? "Enviando..." : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Enviar Calificación
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Bio Personal */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Conoceme</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{bioPersonal}</p>
            </div>

            {/* Frase Elección */}
            {fraseEleccion && (
              <div className="p-4 bg-purple-50/60 rounded-2xl border-l-4 border-[#7C3AED] italic text-slate-800 text-sm font-medium leading-relaxed">
                "{fraseEleccion}"
              </div>
            )}

            {/* Tags Personales */}
            {tagsPersonales.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Intereses y Personalidad</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tagsPersonales.map(tag => (
                    <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                      # {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Contact Panel */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-lg z-30 flex gap-2 justify-center max-w-[430px] mx-auto">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-500 text-white font-bold text-xs py-3 px-2 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200"
            id="btn-whatsapp"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>WhatsApp</span>
          </a>
        )}

        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white font-bold text-xs py-3 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            id="btn-instagram"
          >
            <ExternalLink className="w-4 h-4 text-white" />
            <span>Instagram</span>
          </a>
        )}

        {mailUrl && (
          <a
            href={mailUrl}
            className="bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            id="btn-email"
          >
            <Mail className="w-4 h-4 text-white" />
            <span>Email</span>
          </a>
        )}
      </div>
    </div>
  );
};
