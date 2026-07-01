import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Hardcoded default fallback keys so the app works automatically out-of-the-box in the AI Studio environment
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "apps9X5i2PJe4nz81";

if (!AIRTABLE_PAT) {
  console.warn("ADVERTENCIA: AIRTABLE_PAT no está configurado. Configurá esta variable de entorno antes de desplegar.");
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Parse JSON and urlencoded payloads up to 10MB to allow base64 uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// --- API ROUTES ---

// 1. GET /api/trainers - Get active trainers or filtered by Firebase UID
app.get("/api/trainers", async (req, res) => {
  try {
    const { uid, email } = req.query;
    let formula = "";

    if (uid) {
      // Find specific trainer by Firebase UID
      formula = `{fldxAia9g1UcKdPLu} = '${uid}'`;
    } else if (email) {
      // Find trainer by Email
      formula = `{fldaxVLNrd996M0Ys} = '${email}'`;
    } else {
      // Get all active trainers
      formula = `{fldm49heZHpuYG05A} = 'Activo'`;
    }

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) {
      url.searchParams.append("filterByFormula", formula);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Airtable error response:", errText);
      return res.status(response.status).json({ error: "Error reading from Airtable", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/trainers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/trainers - Register a new trainer
app.post("/api/trainers", async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields) {
      return res.status(400).json({ error: "Missing trainer fields in request body" });
    }

    // Set defaults for new registrations
    fields["fldm49heZHpuYG05A"] = "Pendiente"; // Estado: Pendiente
    fields["fldrn8uvQsxnADrop"] = "Sin verificar"; // Nivel_Verificacion: Sin verificar
    fields["fldOEy3RSNoGzV1eF"] = new Date().toISOString(); // Fecha_Registro: ahora

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
      const errText = await response.text();
      console.error("Airtable POST error:", errText);
      return res.status(response.status).json({ error: "Error writing to Airtable", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/trainers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. PATCH /api/trainers/:id - Edit trainer profile (Protected by UID check)
app.patch("/api/trainers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fields, userUid } = req.body;

    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid validation" });
    }

    // Security check: Fetch the current record first to verify ownership (Firebase_UID)
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblSKTXBPytiaJjEN/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Trainer record not found in Airtable" });
    }

    const currentRecord = await checkResponse.json();
    const existingUid = currentRecord.fields["fldxAia9g1UcKdPLu"]; // Firebase_UID field ID

    if (existingUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: You can only edit your own profile." });
    }

    // Do not allow trainers to change their own verification level or admin notes
    delete fields["fldrn8uvQsxnADrop"]; // Nivel_Verificacion
    delete fields["fldzsLo1fNpdJeEdY"]; // Notas_Admin

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
      const errText = await response.text();
      console.error("Airtable PATCH error:", errText);
      return res.status(response.status).json({ error: "Error updating Airtable record", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/trainers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/resenas - Get reviews for a specific trainer email (visible only)
app.get("/api/resenas", async (req, res) => {
  try {
    const { email } = req.query;
    let formula = "{fldx6Fb1yupW6RnRa} = TRUE()"; // Visible field: fldx6Fb1yupW6RnRa

    if (email) {
      formula = `AND({fldx6Fb1yupW6RnRa} = TRUE(), {fldC2Nz3Xl9wFn5gB} = '${email}')`; // Trainer_Email: fldC2Nz3Xl9wFn5gB
    }

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblEHIWKT3PBnGjSs`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error reading reviews", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/resenas error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. POST /api/resenas - Submit a review
app.post("/api/resenas", async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields) {
      return res.status(400).json({ error: "Missing review fields" });
    }

    // Set default values for a review
    fields["fldx6Fb1yupW6RnRa"] = true; // Visible by default for this MVP
    fields["fldVBQmNBdjYbeFJa"] = new Date().toISOString().split("T")[0]; // Date: YYYY-MM-DD

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error saving review", details: errText });
    }

    // Additionally, we can update the trainer's overall rating and count
    // (This is optionally done client-side, but let's return success first)
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/resenas error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/verificaciones - Upload documentation & request verification
app.post("/api/verificaciones", async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    fields["fldi3f8yutHkKc3Ql"] = "Pendiente"; // Estado_Revision: Pendiente
    fields["fldQM5fd4pMIN95mV"] = new Date().toISOString(); // Fecha_Envio: ahora

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error sending verification request", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/verificaciones error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. POST /api/upload - Handle file upload and return local URL
app.post("/api/upload", async (req, res) => {
  try {
    const { file, filename } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ error: "Missing file base64 data or filename" });
    }

    // Clean up filename to prevent directory traversal
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    // Extract base64 content
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;
    res.json({ url: fileUrl });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- CONEXIONES API ---

// GET /api/conexiones?uid=X - Devuelve todas las conexiones donde Trainer_UID o Usuario_UID = X
app.get("/api/conexiones", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ error: "Missing uid parameter" });
    }

    const formula = `OR({fld5N2NiYpxsmuOaX} = '${uid}', {fldmYw6VU51sfz62t} = '${uid}')`;
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    url.searchParams.append("filterByFormula", formula);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error reading connections", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/conexiones - Crea una solicitud (Estado = Pendiente)
app.post("/api/conexiones", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing connection fields" });
    }

    fields["fldSLmMOlJ29ZZWA3"] = "Pendiente"; // Estado: Pendiente
    fields["fldv5499scxo0ZsRe"] = new Date().toISOString(); // Fecha_Solicitud: ahora

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error creating connection request", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/conexiones/:id - Acepta/rechaza (verifica que el UID del respondedor sea parte de la conexión)
app.patch("/api/conexiones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fields, userUid } = req.body;

    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }

    // Security check: Fetch current record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblFiGoUbWL95lV5R/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Connection record not found" });
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fld5N2NiYpxsmuOaX"];
    const usuarioUid = currentRecord.fields["fldmYw6VU51sfz62t"];

    if (userUid !== trainerUid && userUid !== usuarioUid) {
      return res.status(403).json({ error: "Unauthorized: You are not part of this connection request." });
    }

    fields["flde27wT1DgSP4KlX"] = new Date().toISOString(); // Fecha_Respuesta: ahora

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error updating connection", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- CLASES API ---

// GET /api/clases?trainer_uid=X o GET /api/clases?usuario_uid=X
app.get("/api/clases", async (req, res) => {
  try {
    const { trainer_uid, usuario_uid } = req.query;
    let formula = "";

    if (trainer_uid) {
      formula = `{fldvjNV6oxhkSz34V} = '${trainer_uid}'`;
    } else if (usuario_uid) {
      formula = `FIND('${usuario_uid}', {fldVHgp4Ncfhz87HV})`;
    }

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) {
      url.searchParams.append("filterByFormula", formula);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error reading classes", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clases - Crea clase (solo trainers autenticados)
app.post("/api/clases", async (req, res) => {
  try {
    const { fields, userUid } = req.body;
    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }

    fields["fldvjNV6oxhkSz34V"] = userUid; // Trainer_UID
    fields["fldORKAoJFYsBDuOU"] = "Programada"; // Estado: Programada

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error creating class", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/clases/:id - Edita clase o anota/desanota usuario
app.patch("/api/clases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fields, userUid } = req.body;

    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }

    // Security check: Fetch class record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Class not found" });
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fldvjNV6oxhkSz34V"];

    // Check what is being updated. If updating fields other than Usuarios_Anotados, must be the owner trainer
    const fieldKeys = Object.keys(fields);
    const isOnlyUpdatingAttendance = fieldKeys.length === 1 && fieldKeys[0] === "fldVHgp4Ncfhz87HV";

    if (!isOnlyUpdatingAttendance && trainerUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can edit class details." });
    }

    // If updating attendance, verify that userUid is the one being added/removed or is the trainer
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
        return res.status(403).json({ error: "Unauthorized: You can only join or leave classes on your own behalf." });
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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error updating class", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clases/:id - Cancela clase (solo el trainer dueño)
app.delete("/api/clases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.query;

    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }

    // Security check: Fetch class record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Class not found" });
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fldvjNV6oxhkSz34V"];

    if (trainerUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can cancel classes." });
    }

    const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblOBFdoidtYoDYc2/${id}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error deleting class", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("DELETE /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- PAGOS API ---

// GET /api/pagos?trainer_uid=X o GET /api/pagos?usuario_uid=X
app.get("/api/pagos", async (req, res) => {
  try {
    const { trainer_uid, usuario_uid } = req.query;
    let formula = "";

    if (trainer_uid) {
      formula = `{fld880HBPloZjp0Cx} = '${trainer_uid}'`;
    } else if (usuario_uid) {
      formula = `{fld8AfJf3bk7Gmd9p} = '${usuario_uid}'`;
    }

    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4`);
    url.searchParams.append("returnFieldsByFieldId", "true");
    if (formula) {
      url.searchParams.append("filterByFormula", formula);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error reading payments", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/pagos error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pagos - Registra pago (Estado = Pendiente)
app.post("/api/pagos", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    fields["fldZdQmdRurKxtAuu"] = "Pendiente"; // Estado: Pendiente
    fields["fldA7WKj2hQ1DavUy"] = new Date().toISOString(); // Fecha_Registro: ahora

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error registering payment", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/pagos error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/pagos/:id/confirmar - usuario confirma que pagó → Estado = Confirmado_Usuario
app.patch("/api/pagos/:id/confirmar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;

    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }

    // Security check: Fetch payment record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const currentRecord = await checkResponse.json();
    const usuarioUid = currentRecord.fields["fld8AfJf3bk7Gmd9p"];

    if (usuarioUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: Only the payer can confirm their own payment." });
    }

    const fields = {
      "fldZdQmdRurKxtAuu": "Confirmado_Usuario" // Estado: Confirmado_Usuario
    };

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error confirming payment", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/pagos/:id/confirmar error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/pagos/:id/validar - trainer valida el pago → Estado = Confirmado_Trainer
app.patch("/api/pagos/:id/validar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;

    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }

    // Security check: Fetch payment record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fld880HBPloZjp0Cx"];

    if (trainerUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can validate this payment." });
    }

    const fields = {
      "fldZdQmdRurKxtAuu": "Confirmado_Trainer" // Estado: Confirmado_Trainer
    };

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error validating payment", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/pagos/:id/validar error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/pagos/:id/rechazar - trainer rechaza → Estado = Rechazado
app.patch("/api/pagos/:id/rechazar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;

    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }

    // Security check: Fetch payment record
    const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblrehDipbWmDUMI4/${id}?returnFieldsByFieldId=true`;
    const checkResponse = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!checkResponse.ok) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const currentRecord = await checkResponse.json();
    const trainerUid = currentRecord.fields["fld880HBPloZjp0Cx"];

    if (trainerUid !== userUid) {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can reject this payment." });
    }

    const fields = {
      "fldZdQmdRurKxtAuu": "Rechazado" // Estado: Rechazado
    };

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
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error rejecting payment", details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("PATCH /api/pagos/:id/rechazar error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- VITE DEV SERVER OR STATIC SERVING IN PRODUCTION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TrainerMatch Server running on http://localhost:${PORT}`);
  });
}

startServer();
