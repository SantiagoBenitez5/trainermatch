import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import * as db from "./src/serverDb";

dotenv.config();

const app = express();
const PORT = 3000;

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
    const data = await db.getTrainers(uid as string, email as string);
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
    const data = await db.createTrainer(fields);
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
    const data = await db.updateTrainer(id, fields, userUid);
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: You can only edit your own profile." });
    }
    console.error("PATCH /api/trainers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. GET /api/resenas - Get approved reviews (optional by email)
app.get("/api/resenas", async (req, res) => {
  try {
    const { email } = req.query;
    const data = await db.getResenas(email as string);
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/resenas error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. POST /api/resenas - Add a review for a trainer
app.post("/api/resenas", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing review fields in request body" });
    }
    const data = await db.createResena(fields);
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/resenas error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/verificaciones - Send professional verification request
app.post("/api/verificaciones", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing verification fields in request body" });
    }
    const data = await db.createVerification(fields);
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
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
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

app.get("/api/conexiones", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ error: "Missing uid parameter" });
    }
    const data = await db.getConexiones(uid as string);
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/conexiones", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing connection fields" });
    }
    const data = await db.createConexion(fields);
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/conexiones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fields, userUid } = req.body;
    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }
    const data = await db.updateConexion(id, fields, userUid);
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: You are not part of this connection request." });
    }
    console.error("PATCH /api/conexiones error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- CLASES API ---

app.get("/api/clases", async (req, res) => {
  try {
    const { trainer_uid, usuario_uid } = req.query;
    const data = await db.getClases(trainer_uid as string, usuario_uid as string);
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/clases", async (req, res) => {
  try {
    const { fields, userUid } = req.body;
    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }
    const data = await db.createClase(fields, userUid);
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/clases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fields, userUid } = req.body;
    if (!fields || !userUid) {
      return res.status(400).json({ error: "Missing fields or userUid" });
    }
    const data = await db.updateClase(id, fields, userUid);
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: Only authorized users can edit class details." });
    }
    console.error("PATCH /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/clases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.query;
    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }
    const data = await db.deleteClase(id, userUid as string);
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can cancel classes." });
    }
    console.error("DELETE /api/clases error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- PAGOS API ---

app.get("/api/pagos", async (req, res) => {
  try {
    const { trainer_uid, usuario_uid } = req.query;
    const data = await db.getPagos(trainer_uid as string, usuario_uid as string);
    res.json(data);
  } catch (error: any) {
    console.error("GET /api/pagos error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pagos", async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) {
      return res.status(400).json({ error: "Missing payment fields" });
    }
    const data = await db.createPago(fields);
    res.json(data);
  } catch (error: any) {
    console.error("POST /api/pagos error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/pagos/:id/confirmar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;
    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }
    const data = await db.updatePago(id, userUid, "Confirmado_Usuario", "payer");
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: Only the payer can confirm their own payment." });
    }
    console.error("PATCH /api/pagos/confirmar error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/pagos/:id/validar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;
    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }
    const data = await db.updatePago(id, userUid, "Confirmado_Trainer", "trainer");
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can validate this payment." });
    }
    console.error("PATCH /api/pagos/validar error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/pagos/:id/rechazar", async (req, res) => {
  try {
    const { id } = req.params;
    const { userUid } = req.body;
    if (!userUid) {
      return res.status(400).json({ error: "Missing userUid validation" });
    }
    const data = await db.updatePago(id, userUid, "Rechazado", "trainer");
    res.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "Unauthorized: Only the creator trainer can reject this payment." });
    }
    console.error("PATCH /api/pagos/rechazar error:", error);
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
