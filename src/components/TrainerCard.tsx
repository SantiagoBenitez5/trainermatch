import React from "react";
import { TrainerRecord, FieldMap } from "../types";
import { Star, MapPin, DollarSign, Clock, CheckCircle2, Award, ShieldCheck, Heart } from "lucide-react";
import { motion } from "motion/react";

interface TrainerCardProps {
  trainer: TrainerRecord;
  onViewProfile: (trainer: TrainerRecord) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, recordId: string) => void;
}

export const TrainerCard: React.FC<TrainerCardProps> = ({
  trainer,
  onViewProfile,
  isFavorite,
  onToggleFavorite
}) => {
  const fields = trainer.fields;
  
  // Extract values using FieldMap or direct strings
  const name = fields[FieldMap.nombre] || "Entrenador Sin Nombre";
  const title = fields[FieldMap.tituloProfesional] || "Coach Deportivo";
  const experience = fields[FieldMap.aniosExperiencia] || 0;
  const rating = fields[FieldMap.calificacion] || 5.0;
  const totalReviews = fields[FieldMap.totalResenas] || 0;
  const priceMin = fields[FieldMap.precioDesde] || 0;
  const duration = fields[FieldMap.duracionSesion] || [];
  const disciplines = fields[FieldMap.disciplinas] || [];
  const zoneText = fields[FieldMap.zonaTexto] || "Gualeguaychú";
  const verifLevel = fields[FieldMap.nivelVerificacion] || "Sin verificar";
  const modalities = fields[FieldMap.modalidad] || [];

  // Determine profile image URL
  let imageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200"; // default gym image
  const attachments = fields[FieldMap.fotoAttachment];
  const directUrl = fields[FieldMap.fotoUrl];
  
  if (attachments && attachments.length > 0) {
    imageUrl = attachments[0].url;
  } else if (directUrl) {
    imageUrl = directUrl;
  }

  // Verification Badge Helper
  const renderVerificationBadge = () => {
    switch (verifLevel) {
      case "Titulo universitario":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full" title="Título Universitario Oficial Verificado">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
            <span className="text-[10px]">Univ. Verificado</span>
          </span>
        );
      case "Curso certificado":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full" title="Diploma de Curso Aprobado y Verificado">
            <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-100" />
            <span className="text-[10px]">Certificado</span>
          </span>
        );
      case "Basico":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full" title="Identidad Básica Confirmada con Foto">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px]">Básico</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col cursor-pointer relative"
      onClick={() => onViewProfile(trainer)}
      id={`trainer-card-${trainer.id}`}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(e, trainer.id)}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-sm hover:scale-105 transition-all z-10"
        id={`fav-btn-${trainer.id}`}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isFavorite ? "text-rose-500 fill-rose-500" : "text-slate-400 hover:text-slate-600"
          }`}
        />
      </button>

      {/* Image & Main Info Overlay */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
        />
        {/* Verification badge floating */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
          {renderVerificationBadge()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header & Rating */}
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-bold text-slate-800 text-base leading-tight hover:text-[#7C3AED] transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="text-xs font-bold">{rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{title}</p>

          {/* Disciplines Badges */}
          <div className="flex flex-wrap gap-1 mt-3">
            {disciplines.slice(0, 3).map((disc) => (
              <span
                key={disc}
                className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
              >
                {disc}
              </span>
            ))}
            {disciplines.length > 3 && (
              <span className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                +{disciplines.length - 3}
              </span>
            )}
          </div>

          {/* Details list */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-4 text-[11px] text-slate-600 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-1 text-slate-500 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
              <span className="truncate" title={zoneText}>{zoneText}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <DollarSign className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
              <span className="font-semibold text-slate-700">Desde ${priceMin.toLocaleString()}</span>
            </div>
            {duration.length > 0 && (
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                <span>Sesión {duration[0]}</span>
              </div>
            )}
            {modalities.length > 0 && (
              <div className="flex items-center gap-1 text-slate-500">
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-xs text-[10px] font-medium leading-none truncate">
                  {modalities.join(" / ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View profile button */}
        <div className="mt-4 border-t border-slate-50 pt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">
            {experience} {experience === 1 ? "año" : "años"} de experiencia
          </span>
          <span className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-0.5">
            Ver Perfil →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
