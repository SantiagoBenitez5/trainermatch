// Mock data for TrainerMatch - Gualeguaychú trainers fallback

import { TrainerRecord, ReviewFields } from "./types";

export const MOCK_TRAINERS: TrainerRecord[] = [
  {
    id: "recMock1",
    fields: {
      "fldwnXjaE5Uc6StJ9": "Mariano 'Nano' Rodríguez", // Nombre
      "fldaxVLNrd996M0Ys": "mariano.fit@gmail.com", // Email
      "fldm49heZHpuYG05A": "Activo", // Estado
      "fldrn8uvQsxnADrop": "Titulo universitario", // Nivel_Verificacion
      "fldI2GBRHW7ZnjP6g": "Lic. en Educación Física & Preparador Físico", // Titulo_Profesional
      "fld7u3jSIjhHt7oEF": 8, // Anios_Experiencia
      "fldmDfqWrskf4Am77": "Especialista en entrenamiento de fuerza, descenso de peso y acondicionamiento deportivo general. Ofrezco rutinas personalizadas adaptadas a tus objetivos y nivel, con seguimiento diario.", // Bio_Profesional
      "fld5E5lQqIk2KnmZS": "Amante del running, el café de especialidad y la vida al aire libre. Creo firmemente que el movimiento es salud mental y física.", // Bio_Personal
      "fldHVxfmaBLdTPSSQ": "El único entrenamiento malo es el que no se hizo. ¡Empecemos hoy!", // Frase_Eleccion
      "fldIBZ2E7JDDaRDwb": ["Gimnasio", "Running", "Funcional"], // Disciplinas
      "flds1iMxDdPubYJWD": "Musculación, Acondicionamiento Físico, Planificación de maratón, Descenso de grasa", // Tags_Servicios
      "fld3lsGYnf5MsKh2O": "Motivador, Detallista, Puntual, Amigo", // Tags_Personales
      "fldUYI3YKmOMgcaBR": "Plaza San Martín, Parque Unzué y Gimnasio Oxígeno", // Zona_Texto
      "fldLdOirM8DRwlneG": ["Centro", "Costanera", "A domicilio"], // Zonas_Tags
      "fld31f6FS6KtXOkGM": 12000, // Precio_Desde
      "fldvxnhk6Khz1tcng": 22000, // Precio_Hasta
      "fldf4CkdPHUhRaBhQ": ["60 min", "75 min"], // Duracion_Sesion
      "fldaCVcj7u2bQpxSF": ["Manana", "Tarde", "Noche"], // Horarios
      "fldxOrinvxen5csQt": ["Presencial", "A domicilio"], // Modalidad
      "fldR6sp9t9CCodK06": ["Individual", "Grupos"], // Grupo_Individual
      "fldy95XzPftzGXGEC": "3446554433", // WhatsApp
      "fldnqK2ENBRYI2FT5": "mariano.fit.gchu", // Instagram
      "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400", // Foto_URL
      "fld1tBquwZfKMEZ8N": 5.0, // Calificacion
      "fldfwMmkOlj1wq5jP": 14, // Total_Resenas
      "fldxAia9g1UcKdPLu": "mockUidMariano" // Firebase_UID
    }
  },
  {
    id: "recMock2",
    fields: {
      "fldwnXjaE5Uc6StJ9": "Sofía Bereciartu",
      "fldaxVLNrd996M0Ys": "sofi.yoga@hotmail.com",
      "fldm49heZHpuYG05A": "Activo",
      "fldrn8uvQsxnADrop": "Curso certificado",
      "fldI2GBRHW7ZnjP6g": "Instructora Certificada de Yoga Asthanga y Pilates",
      "fld7u3jSIjhHt7oEF": 4,
      "fldmDfqWrskf4Am77": "Sesiones enfocadas en corregir la postura, ganar flexibilidad y fortalecer el core. Clases dinámicas y personalizadas que se adaptan a tus dolores o limitaciones físicas.",
      "fld5E5lQqIk2KnmZS": "Practico meditación hace 6 años. Me encanta leer novelas históricas y dar caminatas al atardecer por la costanera de Gualeguaychú.",
      "fldHVxfmaBLdTPSSQ": "La salud no es solo lo que comes o cómo te mueves, también es lo que piensas y dices.",
      "fldIBZ2E7JDDaRDwb": ["Yoga-Pilates", "Funcional"],
      "flds1iMxDdPubYJWD": "Postural, Flexibilidad, Pilates Mat, Control Mental, Meditación",
      "fld3lsGYnf5MsKh2O": "Tranquila, Paciente, Empática, Detallista",
      "fldUYI3YKmOMgcaBR": "Estudio Seres (Norte), Parque Unzué y online",
      "fldLdOirM8DRwlneG": ["Norte", "Costanera", "Online"],
      "fld31f6FS6KtXOkGM": 9000,
      "fldvxnhk6Khz1tcng": 15000,
      "fldf4CkdPHUhRaBhQ": ["60 min"],
      "fldaCVcj7u2bQpxSF": ["Manana", "Mediodia", "Tarde"],
      "fldxOrinvxen5csQt": ["Presencial", "Online"],
      "fldR6sp9t9CCodK06": ["Individual", "Grupos"],
      "fldy95XzPftzGXGEC": "3446654321",
      "fldnqK2ENBRYI2FT5": "sofi.yoga.gchu",
      "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
      "fld1tBquwZfKMEZ8N": 4.9,
      "fldfwMmkOlj1wq5jP": 8,
      "fldxAia9g1UcKdPLu": "mockUidSofia"
    }
  },
  {
    id: "recMock3",
    fields: {
      "fldwnXjaE5Uc6StJ9": "Juan Ignacio 'Juani' Silva",
      "fldaxVLNrd996M0Ys": "juani.running@gmail.com",
      "fldm49heZHpuYG05A": "Activo",
      "fldrn8uvQsxnADrop": "Basico",
      "fldI2GBRHW7ZnjP6g": "Preparador Físico de Running y Atletismo",
      "fld7u3jSIjhHt7oEF": 5,
      "fldmDfqWrskf4Am77": "Preparación integral para corredores de calle y trail. Planes de running personalizados semanales por app y entrenamientos presenciales grupales en la pista de atletismo de la ciudad.",
      "fld5E5lQqIk2KnmZS": "Corredor de Ultra Trail y apasionado de las sierras. Cuando no entreno, estoy cocinando asados para amigos.",
      "fldHVxfmaBLdTPSSQ": "No corras para agregar años a tu vida, corre para agregar vida a tus años.",
      "fldIBZ2E7JDDaRDwb": ["Running", "Atletismo", "Ciclismo"],
      "flds1iMxDdPubYJWD": "Técnica de Carrera, Fondos, Intervalos de velocidad, Preparación 10K/21K/42K",
      "fld3lsGYnf5MsKh2O": "Enérgico, Apasionado, Exigente, Compañero",
      "fldUYI3YKmOMgcaBR": "Pista de Atletismo municipal, Parque Unzué y Costanera",
      "fldLdOirM8DRwlneG": ["Norte", "Costanera", "Sur"],
      "fld31f6FS6KtXOkGM": 8000,
      "fldvxnhk6Khz1tcng": 14000,
      "fldf4CkdPHUhRaBhQ": ["60 min", "90 min"],
      "fldaCVcj7u2bQpxSF": ["Manana", "Noche", "Fines de semana"],
      "fldxOrinvxen5csQt": ["Presencial", "Online"],
      "fldR6sp9t9CCodK06": ["Grupos"],
      "fldy95XzPftzGXGEC": "3446887766",
      "fldnqK2ENBRYI2FT5": "juani.trail.run",
      "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=400",
      "fld1tBquwZfKMEZ8N": 4.7,
      "fldfwMmkOlj1wq5jP": 6,
      "fldxAia9g1UcKdPLu": "mockUidJuani"
    }
  },
  {
    id: "recMock4",
    fields: {
      "fldwnXjaE5Uc6StJ9": "Clara Sartori",
      "fldaxVLNrd996M0Ys": "clara.sartori.coaching@gmail.com",
      "fldm49heZHpuYG05A": "Activo",
      "fldrn8uvQsxnADrop": "Titulo universitario",
      "fldI2GBRHW7ZnjP6g": "Licenciada en Alto Rendimiento y Nutricionista",
      "fld7u3jSIjhHt7oEF": 10,
      "fldmDfqWrskf4Am77": "Enfoque 360° combinando entrenamiento funcional intensivo y asesoría de nutrición deportiva. Ideal para redefinir composición corporal, aumento de masa magra y rendimiento atlético real.",
      "fld5E5lQqIk2KnmZS": "Mamá de dos perritos, fanática del paddle y del té matcha. Mi meta es enseñarte a comer y entrenar sin sufrir.",
      "fldHVxfmaBLdTPSSQ": "La disciplina te lleva a donde las excusas te detienen.",
      "fldIBZ2E7JDDaRDwb": ["Gimnasio", "Funcional", "Natacion"],
      "flds1iMxDdPubYJWD": "Nutrición Deportiva, Hipertrofia, Entrenamiento Concurrente, Clases a domicilio",
      "fld3lsGYnf5MsKh2O": "Organizada, Científica, Directa, Comprometida",
      "fldUYI3YKmOMgcaBR": "Club Neptunia, Zona Costanera y Domicilio particular",
      "fldLdOirM8DRwlneG": ["Centro", "Costanera", "A domicilio"],
      "fld31f6FS6KtXOkGM": "18000" as any,
      "fldvxnhk6Khz1tcng": "35000" as any,
      "fldf4CkdPHUhRaBhQ": ["60 min", "75 min", "90 min"],
      "fldaCVcj7u2bQpxSF": ["Manana", "Mediodia", "Tarde"],
      "fldxOrinvxen5csQt": ["Presencial", "A domicilio"],
      "fldR6sp9t9CCodK06": ["Individual"],
      "fldy95XzPftzGXGEC": "3446221199",
      "fldnqK2ENBRYI2FT5": "clara.sartori.fit",
      "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400",
      "fld1tBquwZfKMEZ8N": 5.0,
      "fldfwMmkOlj1wq5jP": 11,
      "fldxAia9g1UcKdPLu": "mockUidClara"
    }
  },
  {
    id: "recMock5",
    fields: {
      "fldwnXjaE5Uc6StJ9": "Leandro 'Leo' Benítez",
      "fldaxVLNrd996M0Ys": "leo.boxgchu@gmail.com",
      "fldm49heZHpuYG05A": "Activo",
      "fldrn8uvQsxnADrop": "Curso certificado",
      "fldI2GBRHW7ZnjP6g": "Instructor de Boxeo Recreativo y Funcional",
      "fld7u3jSIjhHt7oEF": 6,
      "fldmDfqWrskf4Am77": "Clases de boxeo recreativo y fitboxing para descargar tensiones, aprender técnicas de defensa personal y quemar calorías. Divertido, dinámico y apto para hombres y mujeres de todas las edades.",
      "fld5E5lQqIk2KnmZS": "Ex-boxeador amateur, apasionado del tango, los asados de domingo y de la murga de Gualeguaychú.",
      "fldHVxfmaBLdTPSSQ": "Cada golpe que das te hace más fuerte por dentro y por fuera.",
      "fldIBZ2E7JDDaRDwb": ["Boxeo", "Funcional"],
      "flds1iMxDdPubYJWD": "Guanteo dirigido, Manoplas, Saco, HIIT, Defensa Personal",
      "fld3lsGYnf5MsKh2O": "Divertido, Respetuoso, Paciente, Enérgico",
      "fldUYI3YKmOMgcaBR": "Gimnasio Knockout (Zona Norte), Parque Unzué",
      "fldLdOirM8DRwlneG": ["Norte", "Sur", "A domicilio"],
      "fld31f6FS6KtXOkGM": 10000,
      "fldvxnhk6Khz1tcng": 16000,
      "fldf4CkdPHUhRaBhQ": ["60 min", "75 min"],
      "fldaCVcj7u2bQpxSF": ["Tarde", "Noche"],
      "fldxOrinvxen5csQt": ["Presencial", "A domicilio"],
      "fldR6sp9t9CCodK06": ["Individual", "Grupos"],
      "fldy95XzPftzGXGEC": "3446112233",
      "fldnqK2ENBRYI2FT5": "leo.fitbox",
      "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80&w=400",
      "fld1tBquwZfKMEZ8N": 4.8,
      "fldfwMmkOlj1wq5jP": 9,
      "fldxAia9g1UcKdPLu": "mockUidLeo"
    }
  }
];

export const MOCK_REVIEWS: Record<string, ReviewFields[]> = {
  "mariano.fit@gmail.com": [
    {
      "fldC2Nz3Xl9wFn5gB": "mariano.fit@gmail.com",
      "fldM8t01Bl8uW6yGT": "Esteban L.",
      "fldpFRTE0YZ0Hdf6R": 5,
      "fldSMboq3LUzHMvjz": "Excelente entrenador! Muy dedicado, adapta todo a mis dolores de rodilla. Bajé 8 kilos en 3 meses de manera saludable y constante.",
      "fldVBQmNBdjYbeFJa": "2026-05-12",
      "fldx6Fb1yupW6RnRa": true
    },
    {
      "fldC2Nz3Xl9wFn5gB": "mariano.fit@gmail.com",
      "fldM8t01Bl8uW6yGT": "Milagros G.",
      "fldpFRTE0YZ0Hdf6R": 5,
      "fldSMboq3LUzHMvjz": "Nano es un genio! Super puntual, sus clases funcionales grupales en el parque son dinámicas y muy motivadoras. Recomiendo sin dudar.",
      "fldVBQmNBdjYbeFJa": "2026-06-01",
      "fldx6Fb1yupW6RnRa": true
    }
  ],
  "sofi.yoga@hotmail.com": [
    {
      "fldC2Nz3Xl9wFn5gB": "sofi.yoga@hotmail.com",
      "fldM8t01Bl8uW6yGT": "Clara P.",
      "fldpFRTE0YZ0Hdf6R": 5,
      "fldSMboq3LUzHMvjz": "Sofi transmite una paz única. Sus clases de yoga me ayudaron muchísimo con mi estrés y dolor de espalda de oficina.",
      "fldVBQmNBdjYbeFJa": "2026-04-20",
      "fldx6Fb1yupW6RnRa": true
    }
  ],
  "clara.sartori.coaching@gmail.com": [
    {
      "fldC2Nz3Xl9wFn5gB": "clara.sartori.coaching@gmail.com",
      "fldM8t01Bl8uW6yGT": "Roberto S.",
      "fldpFRTE0YZ0Hdf6R": 5,
      "fldSMboq3LUzHMvjz": "La combinación de entrenamiento y nutrición es fantástica. Clara es super científica e impecable en el seguimiento.",
      "fldVBQmNBdjYbeFJa": "2026-06-15",
      "fldx6Fb1yupW6RnRa": true
    }
  ]
};
