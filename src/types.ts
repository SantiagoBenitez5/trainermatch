// TrainerMatch TypeScript Types mapped strictly to Airtable Field IDs

export interface TrainerFields {
  "fldwnXjaE5Uc6StJ9": string; // Nombre
  "fldaxVLNrd996M0Ys": string; // Email
  "fldm49heZHpuYG05A": "Pendiente" | "Activo" | "Pausado" | "Rechazado"; // Estado
  "fldrn8uvQsxnADrop": "Sin verificar" | "Basico" | "Curso certificado" | "Titulo universitario"; // Nivel_Verificacion
  "fldI2GBRHW7ZnjP6g": string; // Titulo_Profesional
  "fld7u3jSIjhHt7oEF": number; // Anios_Experiencia
  "fldmDfqWrskf4Am77": string; // Bio_Profesional
  "fld5E5lQqIk2KnmZS": string; // Bio_Personal
  "fldHVxfmaBLdTPSSQ": string; // Frase_Eleccion
  "fldIBZ2E7JDDaRDwb"?: string[]; // Disciplinas (multipleSelects)
  "flds1iMxDdPubYJWD"?: string; // Tags_Servicios (comma separated)
  "fld3lsGYnf5MsKh2O"?: string; // Tags_Personales (comma separated)
  "fldUYI3YKmOMgcaBR": string; // Zona_Texto
  "fldLdOirM8DRwlneG"?: string[]; // Zonas_Tags (multipleSelects)
  "fld31f6FS6KtXOkGM": number; // Precio_Desde
  "fldvxnhk6Khz1tcng": number; // Precio_Hasta
  "fldf4CkdPHUhRaBhQ"?: string[]; // Duracion_Sesion (multipleSelects)
  "fldaCVcj7u2bQpxSF"?: string[]; // Horarios (multipleSelects)
  "fldxOrinvxen5csQt"?: string[]; // Modalidad (multipleSelects)
  "fldR6sp9t9CCodK06"?: string[]; // Grupo_Individual (multipleSelects)
  "fldy95XzPftzGXGEC": string; // WhatsApp
  "fldnqK2ENBRYI2FT5"?: string; // Instagram (optional)
  "fldeot761GH2iDFyk"?: string; // Foto_URL
  "fldgwURD3Vw7i5Hhy"?: Array<{
    id: string;
    url: string;
    filename: string;
    thumbnails?: {
      small?: { url: string };
      large?: { url: string };
    };
  }>; // Foto_Attachment
  "fld1tBquwZfKMEZ8N"?: number; // Calificacion
  "fldfwMmkOlj1wq5jP"?: number; // Total_Resenas
  "fldxAia9g1UcKdPLu": string; // Firebase_UID
  "fldOEy3RSNoGzV1eF"?: string; // Fecha_Registro
  "fldzsLo1fNpdJeEdY"?: string; // Notas_Admin
}

export interface TrainerRecord {
  id: string;
  fields: TrainerFields;
}

export interface ReviewFields {
  "fldC2Nz3Xl9wFn5gB": string; // Trainer_Email
  "fldM8t01Bl8uW6yGT": string; // Nombre_Cliente
  "fldpFRTE0YZ0Hdf6R": number; // Calificacion
  "fldSMboq3LUzHMvjz": string; // Texto
  "fldVBQmNBdjYbeFJa"?: string; // Fecha (YYYY-MM-DD)
  "fldx6Fb1yupW6RnRa"?: boolean; // Visible
}

export interface ReviewRecord {
  id: string;
  fields: ReviewFields;
}

export interface VerificationFields {
  "fldD1AiTlGnoTIPUa": string; // Trainer_Email
  "fldMuXlDvPxwqgLmU": "Foto personal" | "Diploma de curso" | "Titulo universitario" | "Otro"; // Tipo_Documento
  "fldi3f8yutHkKc3Ql"?: "Pendiente" | "Aprobado" | "Rechazado"; // Estado_Revision
  "fldQM5fd4pMIN95mV"?: string; // Fecha_Envio
  "fldZFGFreP2E8iM6G"?: string; // Notas_Admin
}

export interface VerificationRecord {
  id: string;
  fields: VerificationFields;
}

// --- NEW AIRTABLE CONNECTIONS, CLASSES, PAYMENTS TYPES ---

export interface ConexionFields {
  "fld5N2NiYpxsmuOaX": string; // Trainer_UID
  "fldHp5LKVU0XUkulG": string; // Trainer_Email
  "fldmYw6VU51sfz62t": string; // Usuario_UID
  "fldDQqgDWLEknzPAm": string; // Usuario_Email
  "fldw4Jwc7kq6SUz3n": string; // Usuario_Nombre
  "fldSLmMOlJ29ZZWA3": "Pendiente" | "Activa" | "Rechazada" | "Cancelada"; // Estado
  "fldv5499scxo0ZsRe"?: string; // Fecha_Solicitud
  "flde27wT1DgSP4KlX"?: string; // Fecha_Respuesta
  "fld9LRCPGmfxvODuG": "Usuario" | "Trainer"; // Iniciador
  "fld88ojUzEJqwKoio"?: string; // Notas
}

export interface ConexionRecord {
  id: string;
  fields: ConexionFields;
}

export interface ClaseFields {
  "fld87QH0tdReGaKLT": string; // Titulo
  "fldvjNV6oxhkSz34V": string; // Trainer_UID
  "fld8KSeYEDoxImnph": string; // Trainer_Email
  "fldULIptbbqkM1pJZ": "Sesion individual" | "Clase grupal" | "Rutina online"; // Tipo
  "fldGVEVEy6iIpwb9b": "Futbol" | "Gimnasio" | "Running" | "Basquet" | "Funcional" | "Yoga-Pilates" | "Natacion" | "Ciclismo" | "Atletismo" | "Boxeo" | "Otro"; // Disciplina
  "fld5GqA8PNqmIFJrp": string; // Fecha_Hora
  "fldvzS4FE93uzNHMY": number; // Duracion_Minutos
  "fld3bk5b2r4FCpy8d": string; // Lugar
  "fldh1XAPkKdfTnVEB": number; // Cupo_Maximo
  "fldVYzxNcAP93MAkA": number; // Precio
  "fldwUwWi8eU8vXUfI"?: string; // Descripcion
  "fldVHgp4Ncfhz87HV"?: string; // Usuarios_Anotados
  ldye17iriK8T181P"?: "Pública" | "Profesional privada" | "Rutina personal"; // Visibilidad
  "fldMhg6dIVBz4zndi"?: string; // Usuarios_Pendientes
  "fldAIHxWGe33npWxZ"?: string; // Usuarios_Espera
  "fldY2Ed9MrcpR6uwG"?: "Cualquiera" | "Femenino" | "Masculino"; // Sexo_Preferente
  "fldORKAoJFYsBDuOU": "Programada" | "En curso" | "Finalizada" | "Cancelada"; // Estado
  "fld7DZ1q8VMGOVWPw"?: string; // Notas_Trainer
}

export interface ClaseRecord {
  id: string;
  fields: ClaseFields;
}

export interface PagoFields {
  "fldbCYf6VCk0hbatz": string; // Concepto
  "fld880HBPloZjp0Cx": string; // Trainer_UID
  "fldfRKMzv2sgkmKpF": string; // Trainer_Email
  "fld8AfJf3bk7Gmd9p": string; // Usuario_UID
  "fldIPTOUzeUmPWidy": string; // Usuario_Email
  "fldgNjpumZClUVDJ6": number; // Monto
  "fldWwQdbygtWGNpoP": "Sesion" | "Mensualidad" | "Paquete" | "Otro"; // Tipo
  "fldZdQmdRurKxtAuu": "Pendiente" | "Confirmado_Usuario" | "Confirmado_Trainer" | "Rechazado"; // Estado
  "fldYpQijiVfc3H04k"?: string; // Fecha_Pago (YYYY-MM-DD)
  "fldAH4HoM02wHZXP3"?: string; // Comprobante_URL
  "fldmFXp6KAvI0yS8U"?: string; // Notas
  "fldA7WKj2hQ1DavUy"?: string; // Fecha_Registro
}

export interface PagoRecord {
  id: string;
  fields: PagoFields;
}

// --- LOCAL STORAGE TYPES FOR USER TRAINING ---

export interface TabataPreset {
  id: string;
  name: string;
  series: number;
  workTime: number; // in seconds
  restTime: number; // in seconds
  exerciseName: string;
  restBetweenSeries?: number; // in seconds
  warmup?: number; // in seconds
  cooldown?: number; // in seconds
  soundEnabled?: boolean;
}

export interface WorkoutRecord {
  id: string;
  date: string; // YYYY-MM-DD
  activityType: string;
  duration: number; // minutes
  distance?: number; // km
  notes?: string;
}

export interface WeeklyGoal {
  targetWorkouts: number; // 1-7
  history: { [weekId: string]: number }; // weekId format "YYYY-Www"
}

// Map field IDs to human-readable names for helper accessors
export const FieldMap = {
  nombre: "fldwnXjaE5Uc6StJ9",
  email: "fldaxVLNrd996M0Ys",
  estado: "fldm49heZHpuYG05A",
  nivelVerificacion: "fldrn8uvQsxnADrop",
  tituloProfesional: "fldI2GBRHW7ZnjP6g",
  aniosExperiencia: "fld7u3jSIjhHt7oEF",
  bioProfesional: "fldmDfqWrskf4Am77",
  bioPersonal: "fld5E5lQqIk2KnmZS",
  fraseEleccion: "fldHVxfmaBLdTPSSQ",
  disciplinas: "fldIBZ2E7JDDaRDwb",
  tagsServicios: "flds1iMxDdPubYJWD",
  tagsPersonales: "fld3lsGYnf5MsKh2O",
  zonaTexto: "fldUYI3YKmOMgcaBR",
  zonasTags: "fldLdOirM8DRwlneG",
  precioDesde: "fld31f6FS6KtXOkGM",
  precioHasta: "fldvxnhk6Khz1tcng",
  duracionSesion: "fldf4CkdPHUhRaBhQ",
  horarios: "fldaCVcj7u2bQpxSF",
  modalidad: "fldxOrinvxen5csQt",
  grupoIndividual: "fldR6sp9t9CCodK06",
  whatsapp: "fldy95XzPftzGXGEC",
  instagram: "fldnqK2ENBRYI2FT5",
  fotoUrl: "fldeot761GH2iDFyk",
  fotoAttachment: "fldgwURD3Vw7i5Hhy",
  calificacion: "fld1tBquwZfKMEZ8N",
  totalResenas: "fldfwMmkOlj1wq5jP",
  firebaseUid: "fldxAia9g1UcKdPLu",
  fechaRegistro: "fldOEy3RSNoGzV1eF",
  notesAdmin: "fldzsLo1fNpdJeEdY"
} as const;
