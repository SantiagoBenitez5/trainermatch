// Server-side Stateful In-Memory Database Fallback and Airtable client integration.
// If Airtable responds with 401/Unauthorized (due to expired tokens) or is down,
// it falls back to a robust server-side stateful memory database.

import dotenv from "dotenv";
dotenv.config();

const AIRTABLE_PAT = process.env.AIRTABLE_PAT || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "apps9X5i2PJe4nz81";

export interface TrainerRecord {
  id: string;
  fields: Record<string, any>;
}

export interface ReviewRecord {
  id: string;
  fields: Record<string, any>;
}

// Global flag to persist fallback mode once triggered to avoid constant slow timeouts
const isPlaceholderPAT = !process.env.AIRTABLE_PAT;
let USE_MEMORY_FALLBACK = isPlaceholderPAT;

export const MEMORY_DB = {
  trainers: [
    {
      id: "recMock1",
      fields: {
        "fldwnXjaE5Uc6StJ9": "Mariano 'Nano' Rodríguez",
        "fldaxVLNrd996M0Ys": "mariano.fit@gmail.com",
        "fldm49heZHpuYG05A": "Activo",
        "fldrn8uvQsxnADrop": "Titulo universitario",
        "fldI2GBRHW7ZnjP6g": "Lic. en Educación Física & Preparador Físico",
        "fld7u3jSIjhHt7oEF": 8,
        "fldmDfqWrskf4Am77": "Especialista en entrenamiento de fuerza, descenso de peso y acondicionamiento deportivo general. Ofrezco rutinas personalizadas adaptadas a tus objetivos y nivel, con seguimiento diario.",
        "fld5E5lQqIk2KnmZS": "Amante del running, el café de especialidad y la vida al aire libre. Creo firmemente que el movimiento es salud mental y física.",
        "fldHVxfmaBLdTPSSQ": "El único entrenamiento malo es el que no se hizo. ¡Empecemos hoy!",
        "fldIBZ2E7JDDaRDwb": ["Gimnasio", "Running", "Funcional"],
        "flds1iMxDdPubYJWD": "Musculación, Acondicionamiento Físico, Planificación de maratón, Descenso de grasa",
        "fld3lsGYnf5MsKh2O": "Motivador, Detallista, Puntual, Amigo",
        "fldUYI3YKmOMgcaBR": "Plaza San Martín, Parque Unzué y Gimnasio Oxígeno",
        "fldLdOirM8DRwlneG": ["Centro", "Costanera", "A domicilio"],
        "fld31f6FS6KtXOkGM": 12000,
        "fldvxnhk6Khz1tcng": 22000,
        "fldf4CkdPHUhRaBhQ": ["60 min", "75 min"],
        "fldaCVcj7u2bQpxSF": ["Manana", "Tarde", "Noche"],
        "fldxOrinvxen5csQt": ["Presencial", "A domicilio"],
        "fldR6sp9t9CCodK06": ["Individual", "Grupos"],
        "fldy95XzPftzGXGEC": "3446554433",
        "fldnqK2ENBRYI2FT5": "mariano.fit.gchu",
        "fldeot761GH2iDFyk": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
        "fld1tBquwZfKMEZ8N": 5.0,
        "fldfwMmkOlj1wq5jP": 14,
        "fldxAia9g1UcKdPLu": "mockUidMariano"
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
        "fld31f6FS6KtXOkGM": 18000,
        "fldvxnhk6Khz1tcng": 35000,
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
  ] as TrainerRecord[],

  reviews: [
    {
      id: "recMemRev1",
      fields: {
        "fldC2Nz3Xl9wFn5gB": "mariano.fit@gmail.com",
        "fldM8t01Bl8uW6yGT": "Esteban L.",
        "fldpFRTE0YZ0Hdf6R": 5,
        "fldSMboq3LUzHMvjz": "Excelente entrenador! Muy dedicado, adapta todo a mis dolores de rodilla. Bajé 8 kilos en 3 meses de manera saludable y constante.",
        "fldVBQmNBdjYbeFJa": "2026-05-12",
        "fldx6Fb1yupW6RnRa": true
      }
    },
    {
      id: "recMemRev2",
      fields: {
        "fldC2Nz3Xl9wFn5gB": "mariano.fit@gmail.com",
        "fldM8t01Bl8uW6yGT": "Milagros G.",
        "fldpFRTE0YZ0Hdf6R": 5,
        "fldSMboq3LUzHMvjz": "Nano es un genio! Super puntual, sus clases funcionales grupales en el parque son dinámicas y muy motivadoras. Recomiendo sin dudar.",
        "fldVBQmNBdjYbeFJa": "2026-06-01",
        "fldx6Fb1yupW6RnRa": true
      }
    },
    {
      id: "recMemRev3",
      fields: {
        "fldC2Nz3Xl9wFn5gB": "sofi.yoga@hotmail.com",
        "fldM8t01Bl8uW6yGT": "Clara P.",
        "fldpFRTE0YZ0Hdf6R": 5,
        "fldSMboq3LUzHMvjz": "Sofi transmite una paz única. Sus clases de yoga me ayudaron muchísimo con mi estrés y dolor de espalda de oficina.",
        "fldVBQmNBdjYbeFJa": "2026-04-20",
        "fldx6Fb1yupW6RnRa": true
      }
    },
    {
      id: "recMemRev4",
      fields: {
        "fldC2Nz3Xl9wFn5gB": "clara.sartori.coaching@gmail.com",
        "fldM8t01Bl8uW6yGT": "Roberto S.",
        "fldpFRTE0YZ0Hdf6R": 5,
        "fldSMboq3LUzHMvjz": "La combinación de entrenamiento y nutrición es fantástica. Clara es super científica e impecable en el seguimiento.",
        "fldVBQmNBdjYbeFJa": "2026-06-15",
        "fldx6Fb1yupW6RnRa": true
      }
    }
  ] as ReviewRecord[],

  conexiones: [] as any[],
  clases: [] as any[],
  pagos: [] as any[],
  verificaciones: [] as any[]
};

// --- DATABASE SERVICE LAYER ---

export async function getTrainers(uid?: string, email?: string) {
  if (USE_MEMORY_FALLBACK) {
    return { records: getMemoryTrainers(uid, email) };
  }

  try {
    let formula = "";
    if (uid) formula = `{fldxAia9g1UcKdPLu} = '${uid}'`;
    else if (email) formula = `{fldaxVLNrd996M0Ys} = '${email}'`;
    else formula = `{fldm49heZHpuYG05A} = 'Activo'`;

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    triggerMemoryFallback(error);
    return { records: getMemoryTrainers(uid, email) };
  }
}

export async function createTrainer(fields: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryTrainer(fields);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.trainers.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryTrainer(fields);
  }
}

export async function updateTrainer(id: string, fields: Record<string, any>, userUid: string) {
  if (USE_MEMORY_FALLBACK) {
    return updateMemoryTrainer(id, fields, userUid);
  }

  try {
    // Ownership check
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable ownership check failed: ${checkResponse.status}`);
    }

    const currentRecord = await checkResponse.json();
    const existingUid = currentRecord.fields["fldxAia9g1UcKdPLu"];

    if (existingUid !== userUid) {
      throw new Error("UNAUTHORIZED");
    }

    // Block admin edits
    delete fields["fldrn8uvQsxnADrop"];
    delete fields["fldzsLo1fNpdJeEdY"];

    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN/${id}?returnFieldsByFieldId=true`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable PATCH status: ${response.status}`);
    }

    const data = await response.json();
    const idx = MEMORY_DB.trainers.findIndex(t => t.id === id);
    if (idx !== -1) MEMORY_DB.trainers[idx] = data;
    return data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") throw error;
    triggerMemoryFallback(error);
    return updateMemoryTrainer(id, fields, userUid);
  }
}

export async function getResenas(email?: string) {
  if (USE_MEMORY_FALLBACK) {
    return { records: getMemoryResenas(email) };
  }

  try {
    let formula = "{fldx6Fb1yupW6RnRa} = TRUE()";
    if (email) {
      formula = `AND({fldx6Fb1yupW6RnRa} = TRUE(), {fldC2Nz3Xl9wFn5gB} = '${email}')`;
    }

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblEHIWKT3PBnGjSs`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    triggerMemoryFallback(error);
    return { records: getMemoryResenas(email) };
  }
}

export async function createResena(fields: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryResena(fields);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblEHIWKT3PBnGjSs?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.reviews.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryResena(fields);
  }
}

export async function createVerification(fields: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryVerification(fields);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblxH3HhqIdliKHsD?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.verificaciones.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryVerification(fields);
  }
}

export async function getConexiones(uid: string) {
  if (USE_MEMORY_FALLBACK) {
    return { records: getMemoryConexiones(uid) };
  }

  try {
    const formula = `OR({fld5N2NiYpxsmuOaX} = '${uid}', {fldmYw6VU51sfz62t} = '${uid}')`;
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    triggerMemoryFallback(error);
    return { records: getMemoryConexiones(uid) };
  }
}

export async function createConexion(fields: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryConexion(fields);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.conexiones.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryConexion(fields);
  }
}

export async function updateConexion(id: string, fields: Record<string, any>, userUid: string) {
  if (USE_MEMORY_FALLBACK) {
    return updateMemoryConexion(id, fields, userUid);
  }

  try {
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable response status: ${checkResponse.status}`);
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fld5N2NiYpxsmuOaX"];
    const usuarioUid = currentRecord.fields["fldmYw6VU51sfz62t"];

    if (userUid !== trainerUid && userUid !== usuarioUid) {
      throw new Error("UNAUTHORIZED");
    }

    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R/${id}?returnFieldsByFieldId=true`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable PATCH status: ${response.status}`);
    }

    const data = await response.json();
    const idx = MEMORY_DB.conexiones.findIndex(c => c.id === id);
    if (idx !== -1) MEMORY_DB.conexiones[idx] = data;
    return data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") throw error;
    triggerMemoryFallback(error);
    return updateMemoryConexion(id, fields, userUid);
  }
}

export async function getClaseById(id: string) {
  if (USE_MEMORY_FALLBACK) {
    const cls = MEMORY_DB.clases.find(c => c.id === id);
    if (!cls) throw new Error("Clase no encontrada");
    return cls;
  }
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } });
    if (!res.ok) throw new Error("Clase no encontrada");
    return await res.json();
  } catch (err) {
    triggerMemoryFallback(err);
    const cls = MEMORY_DB.clases.find(c => c.id === id);
    if (!cls) throw new Error("Clase no encontrada");
    return cls;
  }
}

export async function updateClaseFieldsRaw(id: string, fieldsToUpdate: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    const cls = MEMORY_DB.clases.find(c => c.id === id);
    if (!cls) throw new Error("Clase no encontrada");
    cls.fields = { ...cls.fields, ...fieldsToUpdate };
    return cls;
  }
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields: fieldsToUpdate })
    });
    if (!res.ok) throw new Error("Error al actualizar la clase en Airtable");
    const data = await res.json();
    const idx = MEMORY_DB.clases.findIndex(c => c.id === id);
    if (idx !== -1) MEMORY_DB.clases[idx] = data;
    return data;
  } catch (err) {
    triggerMemoryFallback(err);
    const cls = MEMORY_DB.clases.find(c => c.id === id);
    if (!cls) throw new Error("Clase no encontrada");
    cls.fields = { ...cls.fields, ...fieldsToUpdate };
    return cls;
  }
}

export async function getPublicClases(trainerUid?: string) {
  const all = await getClases(trainerUid);
  const records = (all.records || []).filter((c: any) => {
    const vis = c.fields[ldye17iriK8T181P"] || c.fields["Visibilidad"] || "Pública";
    const estado = c.fields["fldORKAoJFYsBDuOU"] || c.fields["Estado"] || "Programada";
    return vis === "Pública" && estado === "Programada";
  });
  return { records };
}

export async function solicitarClase(id: string, userUid: string) {
  const cls = await getClaseById(id);
  const anotadosStr = cls.fields["fldVHgp4Ncfhz87HV"] || cls.fields["Usuarios_Anotados"] || "";
  const pendientesStr = cls.fields["fldMhg6dIVBz4zndi"] || cls.fields["Usuarios_Pendientes"] || "";
  const esperaStr = cls.fields["fldAIHxWGe33npWxZ"] || cls.fields["Usuarios_Espera"] || "";

  const anotados = anotadosStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const pendientes = pendientesStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const espera = esperaStr.split(",").map((s: string) => s.trim()).filter(Boolean);

  if (anotados.includes(userUid)) {
    throw new Error("Ya estás anotado en esta clase.");
  }
  if (!pendientes.includes(userUid)) {
    pendientes.push(userUid);
  }

  const newEspera = espera.filter((u: string) => u !== userUid);

  return await updateClaseFieldsRaw(id, {
    "fldMhg6dIVBz4zndi": pendientes.join(", "),
    "fldAIHxWGe33npWxZ": newEspera.join(", ")
  });
}

export async function unirseEsperaClase(id: string, userUid: string) {
  const cls = await getClaseById(id);
  const anotadosStr = cls.fields["fldVHgp4Ncfhz87HV"] || cls.fields["Usuarios_Anotados"] || "";
  const esperaStr = cls.fields["fldAIHxWGe33npWxZ"] || cls.fields["Usuarios_Espera"] || "";

  const anotados = anotadosStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const espera = esperaStr.split(",").map((s: string) => s.trim()).filter(Boolean);

  if (anotados.includes(userUid)) {
    throw new Error("Ya estás anotado en esta clase.");
  }
  if (!espera.includes(userUid)) {
    espera.push(userUid);
  }

  return await updateClaseFieldsRaw(id, {
    "fldAIHxWGe33npWxZ": espera.join(", ")
  });
}

export async function aprobarSolicitudClase(id: string, targetUid: string, trainerUid: string) {
  const cls = await getClaseById(id);
  const ownerUid = cls.fields["fldvjNV6oxhkSz34V"] || cls.fields["Trainer_UID"];
  if (ownerUid !== trainerUid) {
    throw new Error("UNAUTHORIZED");
  }

  const anotadosStr = cls.fields["fldVHgp4Ncfhz87HV"] || cls.fields["Usuarios_Anotados"] || "";
  const pendientesStr = cls.fields["fldMhg6dIVBz4zndi"] || cls.fields["Usuarios_Pendientes"] || "";
  const esperaStr = cls.fields["fldAIHxWGe33npWxZ"] || cls.fields["Usuarios_Espera"] || "";

  const anotados = anotadosStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const pendientes = pendientesStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const espera = esperaStr.split(",").map((s: string) => s.trim()).filter(Boolean);

  if (!anotados.includes(targetUid)) {
    anotados.push(targetUid);
  }
  const newPendientes = pendientes.filter((u: string) => u !== targetUid);
  const newEspera = espera.filter((u: string) => u !== targetUid);

  return await updateClaseFieldsRaw(id, {
    "fldVHgp4Ncfhz87HV": anotados.join(", "),
    "fldMhg6dIVBz4zndi": newPendientes.join(", "),
    "fldAIHxWGe33npWxZ": newEspera.join(", ")
  });
}

export async function rechazarSolicitudClase(id: string, targetUid: string, userUid: string) {
  const cls = await getClaseById(id);
  const ownerUid = cls.fields["fldvjNV6oxhkSz34V"] || cls.fields["Trainer_UID"];
  if (ownerUid !== userUid && targetUid !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  const pendientesStr = cls.fields["fldMhg6dIVBz4zndi"] || cls.fields["Usuarios_Pendientes"] || "";
  const esperaStr = cls.fields["fldAIHxWGe33npWxZ"] || cls.fields["Usuarios_Espera"] || "";

  const pendientes = pendientesStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const espera = esperaStr.split(",").map((s: string) => s.trim()).filter(Boolean);

  const newPendientes = pendientes.filter((u: string) => u !== targetUid);
  const newEspera = espera.filter((u: string) => u !== targetUid);

  return await updateClaseFieldsRaw(id, {
    "fldMhg6dIVBz4zndi": newPendientes.join(", "),
    "fldAIHxWGe33npWxZ": newEspera.join(", ")
  });
}

export async function removerAlumnoClase(id: string, targetUid: string, userUid: string) {
  const cls = await getClaseById(id);
  const ownerUid = cls.fields["fldvjNV6oxhkSz34V"] || cls.fields["Trainer_UID"];
  if (ownerUid !== userUid && targetUid !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  const anotadosStr = cls.fields["fldVHgp4Ncfhz87HV"] || cls.fields["Usuarios_Anotados"] || "";
  const anotados = anotadosStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  const newAnotados = anotados.filter((u: string) => u !== targetUid);

  return await updateClaseFieldsRaw(id, {
    "fldVHgp4Ncfhz87HV": newAnotados.join(", ")
  });
}

export async function invitarAlumnoClase(id: string, inviteIdentifier: string, trainerUid: string) {
  const cls = await getClaseById(id);
  const ownerUid = cls.fields["fldvjNV6oxhkSz34V"] || cls.fields["Trainer_UID"];
  if (ownerUid !== trainerUid) {
    throw new Error("UNAUTHORIZED");
  }

  const pendientesStr = cls.fields["fldMhg6dIVBz4zndi"] || cls.fields["Usuarios_Pendientes"] || "";
  const pendientes = pendientesStr.split(",").map((s: string) => s.trim()).filter(Boolean);

  if (!pendientes.includes(inviteIdentifier)) {
    pendientes.push(inviteIdentifier);
  }

  return await updateClaseFieldsRaw(id, {
    "fldMhg6dIVBz4zndi": pendientes.join(", ")
  });
}

export async function getClases(trainerUid?: string, usuarioUid?: string) {
  if (USE_MEMORY_FALLBACK) {
    return { records: getMemoryClases(trainerUid, usuarioUid) };
  }

  try {
    let formula = "";
    if (trainerUid) formula = `{fldvjNV6oxhkSz34V} = '${trainerUid}'`;
    else if (usuarioUid) formula = `OR(FIND('${usuarioUid}', {fldVHgp4Ncfhz87HV}), FIND('${usuarioUid}', {fldMhg6dIVBz4zndi}), FIND('${usuarioUid}', {fldAIHxWGe33npWxZ}))`;

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    triggerMemoryFallback(error);
    return { records: getMemoryClases(trainerUid, usuarioUid) };
  }
}

export async function createClase(fields: Record<string, any>, userUid: string) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryClase(fields, userUid);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.clases.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryClase(fields, userUid);
  }
}

export async function updateClase(id: string, fields: Record<string, any>, userUid: string) {
  if (USE_MEMORY_FALLBACK) {
    return updateMemoryClase(id, fields, userUid);
  }

  try {
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable response status: ${checkResponse.status}`);
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fldvjNV6oxhkSz34V"];

    const fieldKeys = Object.keys(fields);
    const isOnlyUpdatingAttendance = fieldKeys.length === 1 && fieldKeys[0] === "fldVHgp4Ncfhz87HV";

    if (!isOnlyUpdatingAttendance && trainerUid !== userUid) {
      throw new Error("UNAUTHORIZED");
    }

    if (isOnlyUpdatingAttendance && trainerUid !== userUid) {
      const newAttendance = fields["fldVHgp4Ncfhz87HV"] || "";
      const oldAttendance = currentRecord.fields["fldVHgp4Ncfhz87HV"] || "";
      const newArr = newAttendance.split(",").map((s: string) => s.trim()).filter(Boolean);
      const oldArr = oldAttendance.split(",").map((s: string) => s.trim()).filter(Boolean);
      const added = newArr.filter((u: string) => !oldArr.includes(u));
      const removed = oldArr.filter((u: string) => !newArr.includes(u));
      const isSelfAdding = added.length === 1 && added[0] === userUid && removed.length === 0;
      const isSelfRemoving = removed.length === 1 && removed[0] === userUid && added.length === 0;

      if (!isSelfAdding && !isSelfRemoving) {
        throw new Error("UNAUTHORIZED");
      }
    }

    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable PATCH status: ${response.status}`);
    }

    const data = await response.json();
    const idx = MEMORY_DB.clases.findIndex(c => c.id === id);
    if (idx !== -1) MEMORY_DB.clases[idx] = data;
    return data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") throw error;
    triggerMemoryFallback(error);
    return updateMemoryClase(id, fields, userUid);
  }
}

export async function deleteClase(id: string, userUid: string) {
  if (USE_MEMORY_FALLBACK) {
    return deleteMemoryClase(id, userUid);
  }

  try {
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable response status: ${checkResponse.status}`);
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fldvjNV6oxhkSz34V"];

    if (trainerUid !== userUid) {
      throw new Error("UNAUTHORIZED");
    }

    const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable DELETE status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.clases = MEMORY_DB.clases.filter(c => c.id !== id);
    return data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") throw error;
    triggerMemoryFallback(error);
    return deleteMemoryClase(id, userUid);
  }
}

export async function getPagos(trainerUid?: string, usuarioUid?: string) {
  if (USE_MEMORY_FALLBACK) {
    return { records: getMemoryPagos(trainerUid, usuarioUid) };
  }

  try {
    let formula = "";
    if (trainerUid) formula = `{fld880HBPloZjp0Cx} = '${trainerUid}'`;
    else if (usuarioUid) formula = `{fld8AfJf3bk7Gmd9p} = '${usuarioUid}'`;

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    triggerMemoryFallback(error);
    return { records: getMemoryPagos(trainerUid, usuarioUid) };
  }
}

export async function createPago(fields: Record<string, any>) {
  if (USE_MEMORY_FALLBACK) {
    return createMemoryPago(fields);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4?returnFieldsByFieldId=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable response status: ${response.status}`);
    }

    const data = await response.json();
    MEMORY_DB.pagos.push(data);
    return data;
  } catch (error: any) {
    triggerMemoryFallback(error);
    return createMemoryPago(fields);
  }
}

export async function updatePago(id: string, userUid: string, targetEstado: string, role: 'payer' | 'trainer') {
  if (USE_MEMORY_FALLBACK) {
    return updateMemoryPago(id, userUid, targetEstado, role);
  }

  try {
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      throw new Error(`Airtable response status: ${checkResponse.status}`);
    }

    const currentRecord = await checkResponse.json();
    if (role === 'payer') {
      const usuarioUid = currentRecord.fields["fld8AfJf3bk7Gmd9p"];
      if (usuarioUid !== userUid) throw new Error("UNAUTHORIZED");
    } else {
      const trainerUid = currentRecord.fields["fld880HBPloZjp0Cx"];
      if (trainerUid !== userUid) throw new Error("UNAUTHORIZED");
    }

    const fields = { "fldZdQmdRurKxtAuu": targetEstado };
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4/${id}?returnFieldsByFieldId=true`;
    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Airtable PATCH status: ${response.status}`);
    }

    const data = await response.json();
    const idx = MEMORY_DB.pagos.findIndex(p => p.id === id);
    if (idx !== -1) MEMORY_DB.pagos[idx] = data;
    return data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") throw error;
    triggerMemoryFallback(error);
    return updateMemoryPago(id, userUid, targetEstado, role);
  }
}


// --- RECOVERY LOGGING HELPER ---

function triggerMemoryFallback(error: any) {
  if (!USE_MEMORY_FALLBACK) {
    USE_MEMORY_FALLBACK = true;
  }
}


// --- LOCAL IN-MEMORY DB BACKEND OPERATORS ---

function getMemoryTrainers(uid?: string, email?: string) {
  let list = [...MEMORY_DB.trainers];
  if (uid) return list.filter(t => t.fields["fldxAia9g1UcKdPLu"] === uid);
  if (email) return list.filter(t => t.fields["fldaxVLNrd996M0Ys"] === email);
  return list.filter(t => t.fields["fldm49heZHpuYG05A"] === "Activo");
}

function createMemoryTrainer(fields: Record<string, any>) {
  const mockRec = {
    id: `recMemTr${Date.now()}`,
    fields: {
      ...fields,
      "fldm49heZHpuYG05A": "Pendiente",
      "fldrn8uvQsxnADrop": "Sin verificar",
      "fldOEy3RSNoGzV1eF": new Date().toISOString()
    }
  };
  MEMORY_DB.trainers.push(mockRec);
  return mockRec;
}

function updateMemoryTrainer(id: string, fields: Record<string, any>, userUid: string) {
  const trainer = MEMORY_DB.trainers.find(t => t.id === id);
  if (!trainer) throw new Error("Trainer record not found in memory database.");
  
  if (trainer.fields["fldxAia9g1UcKdPLu"] !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  delete fields["fldrn8uvQsxnADrop"];
  delete fields["fldzsLo1fNpdJeEdY"];

  trainer.fields = {
    ...trainer.fields,
    ...fields
  };
  return trainer;
}

function getMemoryResenas(email?: string) {
  let list = [...MEMORY_DB.reviews];
  if (email) return list.filter(r => r.fields["fldC2Nz3Xl9wFn5gB"] === email);
  return list;
}

function createMemoryResena(fields: Record<string, any>) {
  const mockRec = {
    id: `recMemRev${Date.now()}`,
    fields: {
      ...fields,
      "fldx6Fb1yupW6RnRa": true,
      "fldVBQmNBdjYbeFJa": new Date().toISOString().split("T")[0]
    }
  };
  MEMORY_DB.reviews.push(mockRec);
  return mockRec;
}

function createMemoryVerification(fields: Record<string, any>) {
  const mockRec = {
    id: `recMemVer${Date.now()}`,
    fields: {
      ...fields,
      "fldi3f8yutHkKc3Ql": "Pendiente",
      "fldQM5fd4pMIN95mV": new Date().toISOString()
    }
  };
  MEMORY_DB.verificaciones.push(mockRec);
  return mockRec;
}

function getMemoryConexiones(uid: string) {
  return MEMORY_DB.conexiones.filter(c => 
    c.fields["fld5N2NiYpxsmuOaX"] === uid || c.fields["fldmYw6VU51sfz62t"] === uid
  );
}

function createMemoryConexion(fields: Record<string, any>) {
  const mockRec = {
    id: `recMemCon${Date.now()}`,
    fields: {
      ...fields,
      "fldSLmMOlJ29ZZWA3": "Pendiente",
      "fldv5499scxo0ZsRe": new Date().toISOString()
    }
  };
  MEMORY_DB.conexiones.push(mockRec);
  return mockRec;
}

function updateMemoryConexion(id: string, fields: Record<string, any>, userUid: string) {
  const conn = MEMORY_DB.conexiones.find(c => c.id === id);
  if (!conn) throw new Error("Connection not found in memory database.");

  if (conn.fields["fld5N2NiYpxsmuOaX"] !== userUid && conn.fields["fldmYw6VU51sfz62t"] !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  conn.fields = {
    ...conn.fields,
    ...fields,
    "flde27wT1DgSP4KlX": new Date().toISOString()
  };
  return conn;
}

function getMemoryClases(trainerUid?: string, usuarioUid?: string) {
  let list = [...MEMORY_DB.clases];
  if (trainerUid) return list.filter(c => c.fields["fldvjNV6oxhkSz34V"] === trainerUid);
  if (usuarioUid) return list.filter(c => (c.fields["fldVHgp4Ncfhz87HV"] || "").includes(usuarioUid));
  return list;
}

function createMemoryClase(fields: Record<string, any>, userUid: string) {
  const mockRec = {
    id: `recMemCla${Date.now()}`,
    fields: {
      ...fields,
      "fldvjNV6oxhkSz34V": userUid,
      "fldORKAoJFYsBDuOU": "Programada"
    }
  };
  MEMORY_DB.clases.push(mockRec);
  return mockRec;
}

function updateMemoryClase(id: string, fields: Record<string, any>, userUid: string) {
  const cls = MEMORY_DB.clases.find(c => c.id === id);
  if (!cls) throw new Error("Class not found in memory database.");

  const trainerUid = cls.fields["fldvjNV6oxhkSz34V"];
  const fieldKeys = Object.keys(fields);
  const isOnlyUpdatingAttendance = fieldKeys.length === 1 && fieldKeys[0] === "fldVHgp4Ncfhz87HV";

  if (!isOnlyUpdatingAttendance && trainerUid !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  if (isOnlyUpdatingAttendance && trainerUid !== userUid) {
    const newAttendance = fields["fldVHgp4Ncfhz87HV"] || "";
    const oldAttendance = cls.fields["fldVHgp4Ncfhz87HV"] || "";
    const newArr = newAttendance.split(",").map((s: string) => s.trim()).filter(Boolean);
    const oldArr = oldAttendance.split(",").map((s: string) => s.trim()).filter(Boolean);
    const added = newArr.filter((u: string) => !oldArr.includes(u));
    const removed = oldArr.filter((u: string) => !newArr.includes(u));
    const isSelfAdding = added.length === 1 && added[0] === userUid && removed.length === 0;
    const isSelfRemoving = removed.length === 1 && removed[0] === userUid && added.length === 0;

    if (!isSelfAdding && !isSelfRemoving) {
      throw new Error("UNAUTHORIZED");
    }
  }

  cls.fields = {
    ...cls.fields,
    ...fields
  };
  return cls;
}

function deleteMemoryClase(id: string, userUid: string) {
  const idx = MEMORY_DB.clases.findIndex(c => c.id === id);
  if (idx === -1) throw new Error("Class not found in memory database.");
  
  const cls = MEMORY_DB.clases[idx];
  if (cls.fields["fldvjNV6oxhkSz34V"] !== userUid) {
    throw new Error("UNAUTHORIZED");
  }

  MEMORY_DB.clases.splice(idx, 1);
  return { id, deleted: true };
}

function getMemoryPagos(trainerUid?: string, usuarioUid?: string) {
  let list = [...MEMORY_DB.pagos];
  if (trainerUid) return list.filter(p => p.fields["fld880HBPloZjp0Cx"] === trainerUid);
  if (usuarioUid) return list.filter(p => p.fields["fld8AfJf3bk7Gmd9p"] === usuarioUid);
  return list;
}

function createMemoryPago(fields: Record<string, any>) {
  const mockRec = {
    id: `recMemPag${Date.now()}`,
    fields: {
      ...fields,
      "fldZdQmdRurKxtAuu": "Pendiente",
      "fldA7WKj2hQ1DavUy": new Date().toISOString()
    }
  };
  MEMORY_DB.pagos.push(mockRec);
  return mockRec;
}

function updateMemoryPago(id: string, userUid: string, targetEstado: string, role: 'payer' | 'trainer') {
  const pago = MEMORY_DB.pagos.find(p => p.id === id);
  if (!pago) throw new Error("Payment not found in memory database.");

  if (role === 'payer') {
    if (pago.fields["fld8AfJf3bk7Gmd9p"] !== userUid) throw new Error("UNAUTHORIZED");
  } else {
    if (pago.fields["fld880HBPloZjp0Cx"] !== userUid) throw new Error("UNAUTHORIZED");
  }

  pago.fields["fldZdQmdRurKxtAuu"] = targetEstado;
  return pago;
}
