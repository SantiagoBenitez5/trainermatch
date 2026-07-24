import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, CreditCard, Plus, Check, X, Phone, Mail, 
  Clock, MapPin, DollarSign, ArrowRight, UserPlus, Info, Trash2, Edit
} from "lucide-react";
import { 
  ConexionRecord, ClaseRecord, PagoRecord, TrainerRecord,
  ConexionFields, ClaseFields, PagoFields 
} from "../types";

interface TrainerPanelProps {
  currentUser: { uid: string; email: string; isMock?: boolean };
  myProfile: TrainerRecord;
}

export default function TrainerPanel({ currentUser, myProfile }: TrainerPanelProps) {
  const [activeSubView, setActiveSubView] = useState<"resumen" | "alumnos" | "clases" | "contabilidad">("resumen");
  
  // Data State
  const [conexiones, setConexiones] = useState<ConexionRecord[]>([]);
  const [clases, setClases] = useState<ClaseRecord[]>([]);
  const [pagos, setPagos] = useState<PagoRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");

  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState<Partial<ClaseFields>>({
    "fld87QH0tdReGaKLT": "", // Titulo
    "fldye17iriK8T181P"": "Pública", // Visibilidad
    "fldULIptbbqkM1pJZ": "Clase grupal", // Tipo
    "fldGVEVEy6iIpwb9b": "Gimnasio", // Disciplina
    "fld5GqA8PNqmIFJrp": "", // Fecha_Hora
    "fldvzS4FE93uzNHMY": 60, // Duracion_Minutos
    "fld3bk5b2r4FCpy8d": "", // Lugar
    "fldh1XAPkKdfTnVEB": 10, // Cupo_Maximo
    "fldVYzxNcAP93MAkA": 5000, // Precio
    "fldwUwWi8eU8vXUfI": "", // Descripcion
    "fldY2Ed9MrcpR6uwG": "Cualquiera", // Sexo_Preferente
    "fld7DZ1q8VMGOVWPw": "" // Notas_Trainer
  });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Selected class for student management detail modal
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClaseRecord | null>(null);
  const [classInviteEmail, setClassInviteEmail] = useState("");
  const [classInviteLoading, setClassInviteLoading] = useState(false);

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoForm, setPagoForm] = useState<Partial<PagoFields>>({
    "fldbCYf6VCk0hbatz": "", // Concepto
    "fld8AfJf3bk7Gmd9p": "", // Usuario_UID
    "fldgNjpumZClUVDJ6": 4000, // Monto
    "fldWwQdbygtWGNpoP": "Sesion", // Tipo
    "fldYpQijiVfc3H04k": new Date().toISOString().split("T")[0], // Fecha_Pago
    "fldmFXp6KAvI0yS8U": "" // Notas
  });

  // Selected client for payment viewing
  const [viewingPaymentUserUid, setViewingPaymentUserUid] = useState<string | null>(null);

  // Filters for classes
  const [classTimeFilter, setClassTimeFilter] = useState<"proximas" | "pasadas" | "todas">("proximas");
  const [classVisibilityFilter, setClassVisibilityFilter] = useState<"todas" | "Pública" | "Profesional privada" | "Rutina personal">("todas");

  // Fetch Trainer Data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Get connections
      const conRes = await fetch(`/api/conexiones?uid=${currentUser.uid}`);
      let conRecords: ConexionRecord[] = [];
      if (conRes.ok) {
        const data = await conRes.json();
        conRecords = data.records || [];
        setConexiones(conRecords);
      }

      // Get classes
      const claRes = await fetch(`/api/clases?trainer_uid=${currentUser.uid}`);
      if (claRes.ok) {
        const data = await claRes.json();
        setClases(data.records || []);
      }

      // Get payments
      const pagRes = await fetch(`/api/pagos?trainer_uid=${currentUser.uid}`);
      if (pagRes.ok) {
        const data = await pagRes.json();
        setPagos(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching trainer panel data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.uid]);

  // Operations

  // 1. Connection request response (accept / reject)
  const handleConnectionResponse = async (id: string, accept: boolean) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/conexiones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "fldSLmMOlJ29ZZWA3": accept ? "Activa" : "Rechazada"
          },
          userUid: currentUser.uid
        })
      });

      if (res.ok) {
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al procesar solicitud: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Invite client
  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/conexiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "fld5N2NiYpxsmuOaX": currentUser.uid,
            "fldHp5LKVU0XUkulG": currentUser.email,
            "fldmYw6VU51sfz62t": "pendiente", // Placeholder UID
            "fldDQqgDWLEknzPAm": inviteEmail,
            "fldw4Jwc7kq6SUz3n": inviteName || "Alumno Invitado",
            "fld9LRCPGmfxvODuG": "Trainer",
            "fld88ojUzEJqwKoio": inviteNotes
          }
        })
      });

      if (res.ok) {
        setInviteEmail("");
        setInviteName("");
        setInviteNotes("");
        setShowInviteModal(false);
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al enviar invitación: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Save/Update Class
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm["fld87QH0tdReGaKLT"] || !classForm["fld5GqA8PNqmIFJrp"]) {
      alert("Completá el título y la fecha/hora.");
      return;
    }

    try {
      setActionLoading(true);
      const url = editingClassId ? `/api/clases/${editingClassId}` : "/api/clases";
      const method = editingClassId ? "PATCH" : "POST";

      const payloadFields = {
        ...classForm,
        "fld8KSeYEDoxImnph": currentUser.email,
        "fldvzS4FE93uzNHMY": Number(classForm["fldvzS4FE93uzNHMY"]),
        "fldh1XAPkKdfTnVEB": Number(classForm["fldh1XAPkKdfTnVEB"]),
        "fldVYzxNcAP93MAkA": Number(classForm["fldVYzxNcAP93MAkA"])
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: payloadFields,
          userUid: currentUser.uid
        })
      });

      if (res.ok) {
        setShowClassModal(false);
        setEditingClassId(null);
        setClassForm({
          "fld87QH0tdReGaKLT": "",
          "fldULIptbbqkM1pJZ": "Sesion individual",
          "fldGVEVEy6iIpwb9b": "Gimnasio",
          "fld5GqA8PNqmIFJrp": "",
          "fldvzS4FE93uzNHMY": 60,
          "fld3bk5b2r4FCpy8d": "",
          "fldh1XAPkKdfTnVEB": 10,
          "fldVYzxNcAP93MAkA": 5000,
          "fldwUwWi8eU8vXUfI": "",
          "fld7DZ1q8VMGOVWPw": ""
        });
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al guardar clase: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Class enrollment action handlers
  const handleApproveStudent = async (classId: string, studentUid: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/clases/${classId}/aprobar/${encodeURIComponent(studentUid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: currentUser.uid })
      });
      if (res.ok) {
        const updatedClase = await res.json();
        if (selectedClassDetail && selectedClassDetail.id === classId) {
          setSelectedClassDetail(updatedClase);
        }
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al aprobar solicitud: " + text);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectStudent = async (classId: string, studentUid: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/clases/${classId}/rechazar/${encodeURIComponent(studentUid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: currentUser.uid })
      });
      if (res.ok) {
        const updatedClase = await res.json();
        if (selectedClassDetail && selectedClassDetail.id === classId) {
          setSelectedClassDetail(updatedClase);
        }
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al rechazar solicitud: " + text);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async (classId: string, studentUid: string) => {
    if (!window.confirm("¿Confirmás remover a este alumno de la clase?")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/clases/${classId}/remover/${encodeURIComponent(studentUid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: currentUser.uid })
      });
      if (res.ok) {
        const updatedClase = await res.json();
        if (selectedClassDetail && selectedClassDetail.id === classId) {
          setSelectedClassDetail(updatedClase);
        }
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al remover alumno: " + text);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteStudentToClass = async (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!classInviteEmail) return;
    try {
      setClassInviteLoading(true);
      const res = await fetch(`/api/clases/${classId}/invitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteEmail: classInviteEmail, userUid: currentUser.uid })
      });
      if (res.ok) {
        const updatedClase = await res.json();
        if (selectedClassDetail && selectedClassDetail.id === classId) {
          setSelectedClassDetail(updatedClase);
        }
        setClassInviteEmail("");
        alert(`Invitación enviada exitosamente a ${classInviteEmail}`);
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al invitar alumno: " + text);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setClassInviteLoading(false);
    }
  };

  // 4. Cancel class
  const handleCancelClass = async (classId: string) => {
    if (!window.confirm("¿Estás seguro de que querés cancelar esta clase? Esta acción notificará a los alumnos anotados.")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/clases/${classId}?userUid=${currentUser.uid}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al cancelar la clase: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Toggle student attendance check
  const handleToggleAttendance = async (clase: ClaseRecord, studentUid: string, hasAttended: boolean) => {
    try {
      // Notes_Trainer has comma-separated list of attended student UIDs (or we can use fld7DZ1q8VMGOVWPw)
      // Let's use fld7DZ1q8VMGOVWPw to persist attendance list!
      const currentAttendance = clase.fields["fld7DZ1q8VMGOVWPw"] || "";
      let arr = currentAttendance.split(",").map(s => s.trim()).filter(Boolean);
      
      if (hasAttended) {
        if (!arr.includes(studentUid)) arr.push(studentUid);
      } else {
        arr = arr.filter(u => u !== studentUid);
      }

      const res = await fetch(`/api/clases/${clase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "fld7DZ1q8VMGOVWPw": arr.join(",")
          },
          userUid: currentUser.uid
        })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Record payment manually
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentUid = pagoForm["fld8AfJf3bk7Gmd9p"];
    if (!studentUid || !pagoForm["fldbCYf6VCk0hbatz"] || !pagoForm["fldgNjpumZClUVDJ6"]) {
      alert("Completá concepto, alumno y monto.");
      return;
    }

    const selectedConexion = conexiones.find(c => c.fields["fldmYw6VU51sfz62t"] === studentUid);
    if (!selectedConexion) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            ...pagoForm,
            "fld880HBPloZjp0Cx": currentUser.uid,
            "fldfRKMzv2sgkmKpF": currentUser.email,
            "fldIPTOUzeUmPWidy": selectedConexion.fields["fldDQqgDWLEknzPAm"], // Usuario_Email
            "fldgNjpumZClUVDJ6": Number(pagoForm["fldgNjpumZClUVDJ6"]),
            "fldZdQmdRurKxtAuu": "Pendiente" // Default state
          }
        })
      });

      if (res.ok) {
        setShowPagoModal(false);
        setPagoForm({
          "fldbCYf6VCk0hbatz": "",
          "fld8AfJf3bk7Gmd9p": "",
          "fldgNjpumZClUVDJ6": 4000,
          "fldWwQdbygtWGNpoP": "Sesion",
          "fldYpQijiVfc3H04k": new Date().toISOString().split("T")[0],
          "fldmFXp6KAvI0yS8U": ""
        });
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al registrar pago: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Validate / Reject customer self-payment
  const handleValidatePayment = async (pagoId: string, validate: boolean) => {
    try {
      setActionLoading(true);
      const endpoint = validate ? "validar" : "rechazar";
      const res = await fetch(`/api/pagos/${pagoId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: currentUser.uid })
      });

      if (res.ok) {
        await fetchData();
      } else {
        const text = await res.text();
        alert("Error al procesar pago: " + text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const activeAlumnos = conexiones.filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Activa");
  const pendingRequests = conexiones.filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Pendiente" && c.fields["fld9LRCPGmfxvODuG"] === "Usuario");
  
  const pendingValidationCount = pagos.filter(p => p.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario").length;

  const currentMonthIngresos = pagos
    .filter(p => {
      if (p.fields["fldZdQmdRurKxtAuu"] !== "Confirmado_Trainer") return false;
      const dateStr = p.fields["fldYpQijiVfc3H04k"] || p.fields["fldA7WKj2hQ1DavUy"];
      if (!dateStr) return false;
      const paymentMonth = new Date(dateStr).getMonth();
      const currentMonth = new Date().getMonth();
      const paymentYear = new Date(dateStr).getFullYear();
      const currentYear = new Date().getFullYear();
      return paymentMonth === currentMonth && paymentYear === currentYear;
    })
    .reduce((sum, p) => sum + (p.fields["fldgNjpumZClUVDJ6"] || 0), 0);

  // Total Confirmed vs Pending for Month
  const totalConfirmedMonthly = pagos
    .filter(p => p.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Trainer")
    .reduce((sum, p) => sum + (p.fields["fldgNjpumZClUVDJ6"] || 0), 0);

  const totalPendingMonthly = pagos
    .filter(p => p.fields["fldZdQmdRurKxtAuu"] === "Pendiente" || p.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario")
    .reduce((sum, p) => sum + (p.fields["fldgNjpumZClUVDJ6"] || 0), 0);

  // Filter classes by time & visibility
  const now = new Date();
  const sortedClases = [...clases].sort((a, b) => new Date(a.fields["fld5GqA8PNqmIFJrp"]).getTime() - new Date(b.fields["fld5GqA8PNqmIFJrp"]).getTime());
  
  const filteredClases = sortedClases.filter(c => {
    const vis = c.fields["fldye17iriK8T181P""] || (c.fields as any)["Visibilidad"] || "Pública";
    if (classVisibilityFilter !== "todas" && vis !== classVisibilityFilter) {
      return false;
    }

    const classDate = new Date(c.fields["fld5GqA8PNqmIFJrp"]);
    if (classTimeFilter === "proximas") return classDate >= now && c.fields["fldORKAoJFYsBDuOU"] !== "Cancelada";
    if (classTimeFilter === "pasadas") return classDate < now || c.fields["fldORKAoJFYsBDuOU"] === "Cancelada";
    return true;
  });

  const nextThreeClases = sortedClases
    .filter(c => new Date(c.fields["fld5GqA8PNqmIFJrp"]) >= now && c.fields["fldORKAoJFYsBDuOU"] === "Programada")
    .slice(0, 3);

  return (
    <div className="space-y-4">
      
      {/* Tab Header Navigation */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl shadow-xs">
        <button
          onClick={() => { setActiveSubView("resumen"); setViewingPaymentUserUid(null); }}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
            activeSubView === "resumen" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => { setActiveSubView("alumnos"); setViewingPaymentUserUid(null); }}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeSubView === "alumnos" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Alumnos</span>
          {pendingRequests.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          )}
        </button>
        <button
          onClick={() => { setActiveSubView("clases"); setViewingPaymentUserUid(null); }}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
            activeSubView === "clases" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Clases
        </button>
        <button
          onClick={() => { setActiveSubView("contabilidad"); setViewingPaymentUserUid(null); }}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeSubView === "contabilidad" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Pagos</span>
          {pendingValidationCount > 0 && (
            <span className="bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
              {pendingValidationCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#7C3AED] animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Sincronizando con Airtable...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. RESUMEN VIEW */}
          {activeSubView === "resumen" && (
            <div className="space-y-4">
              
              {/* Micro KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Alumnos Activos</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-2">{activeAlumnos.length}</p>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">Conexiones confirmadas</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos de Junio</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-2">
                    ${currentMonthIngresos.toLocaleString("es-AR")}
                  </p>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">Suma de pagos validados</span>
                </div>
              </div>

              {/* Validation alert banner */}
              {pendingValidationCount > 0 && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-amber-800">Tenés {pendingValidationCount} {pendingValidationCount === 1 ? 'pago' : 'pagos'} para validar</span>
                  </div>
                  <button
                    onClick={() => setActiveSubView("contabilidad")}
                    className="text-[10px] font-black text-[#7C3AED] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Ir a validar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Next 3 classes */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Próximas Clases</h3>
                  <button
                    onClick={() => setActiveSubView("clases")}
                    className="text-[10px] font-black text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    Ver calendario
                  </button>
                </div>

                {nextThreeClases.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No tenés clases programadas próximamente.</p>
                ) : (
                  <div className="space-y-2.5">
                    {nextThreeClases.map((c) => {
                      const classDate = new Date(c.fields["fld5GqA8PNqmIFJrp"]);
                      const enrolledCount = (c.fields["fldVHgp4Ncfhz87HV"] || "").split(",").filter(Boolean).length;
                      
                      return (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100/60">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-xs text-slate-800 truncate">{c.fields["fld87QH0tdReGaKLT"]}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-semibold text-purple-600">{c.fields["fldGVEVEy6iIpwb9b"]}</span>
                              <span>•</span>
                              <span>{classDate.toLocaleDateString("es-AR", { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}hs</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {enrolledCount} / {c.fields["fldh1XAPkKdfTnVEB"] || 0} alumnos
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. MIS ALUMNOS VIEW */}
          {activeSubView === "alumnos" && (
            <div className="space-y-4">
              
              {/* Header block with Invitation button */}
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mis Alumnos</h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invitar Alumno</span>
                </button>
              </div>

              {/* Solicitudes de Conexión Pendientes */}
              {pendingRequests.length > 0 && (
                <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200/80 space-y-3">
                  <h4 className="font-extrabold text-purple-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Solicitudes de Conexión ({pendingRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{req.fields["fldw4Jwc7kq6SUz3n"]}</p>
                          <p className="text-[10px] text-slate-500 truncate">{req.fields["fldDQqgDWLEknzPAm"]}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleConnectionResponse(req.id, true)}
                            disabled={actionLoading}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                            title="Aceptar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleConnectionResponse(req.id, false)}
                            disabled={actionLoading}
                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Connections List */}
              {activeAlumnos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-xs">Aún no tenés alumnos activos</h4>
                  <p className="text-[10px] text-slate-400">Podés enviar una invitación por email o esperar que te soliciten conexión desde tu perfil.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeAlumnos.map((al) => (
                    <div key={al.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{al.fields["fldw4Jwc7kq6SUz3n"]}</p>
                        <p className="text-[10px] text-slate-500 truncate">{al.fields["fldDQqgDWLEknzPAm"]}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/5493446000000?text=Hola%20${encodeURIComponent(al.fields["fldw4Jwc7kq6SUz3n"])},%20¿cómo%20va?%20Te%20escribo%20de%20TrainerMatch.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          title="Contactar por WhatsApp"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        {/* Ver Pagos Filter button */}
                        <button
                          onClick={() => {
                            setViewingPaymentUserUid(al.fields["fldmYw6VU51sfz62t"]);
                            setActiveSubView("contabilidad");
                          }}
                          className="px-2.5 py-1.5 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Ver pagos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MIS CLASES VIEW */}
          {activeSubView === "clases" && (
            <div className="space-y-4">
              
              {/* Header block with creation button */}
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mis Clases</h3>
                <button
                  onClick={() => { setEditingClassId(null); setShowClassModal(true); }}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Clase</span>
                </button>
              </div>

              {/* Visibility Filter Tabs */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Visibilidad</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setClassVisibilityFilter("todas")}
                    className={`flex-1 py-1 font-bold rounded-md transition-all cursor-pointer ${
                      classVisibilityFilter === "todas" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setClassVisibilityFilter("Pública")}
                    className={`flex-1 py-1 font-bold rounded-md transition-all cursor-pointer ${
                      classVisibilityFilter === "Pública" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Públicas
                  </button>
                  <button
                    onClick={() => setClassVisibilityFilter("Profesional privada")}
                    className={`flex-1 py-1 font-bold rounded-md transition-all cursor-pointer ${
                      classVisibilityFilter === "Profesional privada" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Privadas
                  </button>
                  <button
                    onClick={() => setClassVisibilityFilter("Rutina personal")}
                    className={`flex-1 py-1 font-bold rounded-md transition-all cursor-pointer ${
                      classVisibilityFilter === "Rutina personal" ? "bg-purple-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Rutinas
                  </button>
                </div>
              </div>

              {/* Time Filter Bar */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setClassTimeFilter("proximas")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    classTimeFilter === "proximas" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Próximas
                </button>
                <button
                  onClick={() => setClassTimeFilter("pasadas")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    classTimeFilter === "pasadas" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pasadas / Canceladas
                </button>
                <button
                  onClick={() => setClassTimeFilter("todas")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    classTimeFilter === "todas" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Todas
                </button>
              </div>

              {/* Class list */}
              {filteredClases.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs p-6">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700 text-xs">No hay clases registradas</h4>
                  <p className="text-[10px] text-slate-400">Creá tu primera clase grupal o sesión privada para gestionar alumnos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClases.map((clase) => {
                    const classDate = new Date(clase.fields["fld5GqA8PNqmIFJrp"]);
                    const vis = clase.fields["fldye17iriK8T181P""] || (clase.fields as any)["Visibilidad"] || "Pública";
                    const signedUpUids = (clase.fields["fldVHgp4Ncfhz87HV"] || "").split(",").map(s => s.trim()).filter(Boolean);
                    const pendingUids = (clase.fields["fldMhg6dIVBz4zndi"] || (clase.fields as any)["Usuarios_Pendientes"] || "").split(",").map(s => s.trim()).filter(Boolean);
                    const waitlistUids = (clase.fields["fldAIHxWGe33npWxZ"] || (clase.fields as any)["Usuarios_Espera"] || "").split(",").map(s => s.trim()).filter(Boolean);
                    const isPast = classDate < now;
                    const isCancelled = clase.fields["fldORKAoJFYsBDuOU"] === "Cancelada";

                    return (
                      <div key={clase.id} className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-all ${isCancelled ? 'border-red-100 bg-red-50/20 opacity-80' : 'border-slate-100'}`}>
                        
                        {/* Title & info */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {/* Visibilidad Pill */}
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                vis === "Pública" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                vis === "Profesional privada" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                "bg-purple-100 text-purple-800 border border-purple-200"
                              }`}>
                                {vis}
                              </span>

                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {clase.fields["fldULIptbbqkM1pJZ"]} • {clase.fields["fldGVEVEy6iIpwb9b"]}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-800 truncate">{clase.fields["fld87QH0tdReGaKLT"]}</h4>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            {!isCancelled && !isPast && (
                              <button
                                onClick={() => {
                                  setEditingClassId(clase.id);
                                  setClassForm(clase.fields);
                                  setShowClassModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isCancelled && (
                              <button
                                onClick={() => handleCancelClass(clase.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 rounded-lg cursor-pointer"
                                title="Cancelar clase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Timing and details grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-50 pt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{classDate.toLocaleDateString("es-AR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}hs ({clase.fields["fldvzS4FE93uzNHMY"]} min)</span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{clase.fields["fld3bk5b2r4FCpy8d"] || "A convenir"}</span>
                          </div>
                        </div>

                        {/* Student status & Manage button */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                          <div className="space-y-0.5 text-[10px]">
                            <div className="font-bold text-slate-700">
                              Alumnos: <span className="text-[#7C3AED] font-extrabold">{signedUpUids.length} / {clase.fields["fldh1XAPkKdfTnVEB"] || "Sin límite"}</span>
                            </div>
                            <div className="flex gap-2 text-[9px]">
                              {pendingUids.length > 0 && (
                                <span className="text-amber-600 font-extrabold">● {pendingUids.length} pendientes</span>
                              )}
                              {waitlistUids.length > 0 && (
                                <span className="text-purple-600 font-extrabold">● {waitlistUids.length} en espera</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedClassDetail(clase)}
                            className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-bold text-[10px] cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            <span>Gestionar Alumnos</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. CONTABILIDAD VIEW */}
          {activeSubView === "contabilidad" && (
            <div className="space-y-4">
              
              {/* Filter warning if active */}
              {viewingPaymentUserUid && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-900">Mostrando solo pagos del alumno seleccionado</span>
                  <button
                    onClick={() => setViewingPaymentUserUid(null)}
                    className="text-[10px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    Mostrar todos
                  </button>
                </div>
              )}

              {/* Monthly totals summary block */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Contabilidad Total</span>
                  <h4 className="font-black text-lg text-emerald-400">${totalConfirmedMonthly.toLocaleString("es-AR")}</h4>
                  <p className="text-[10px] text-slate-400">Total Validado</p>
                </div>
                <div className="w-px h-10 bg-slate-800"></div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Por Recibir / Validar</span>
                  <h4 className="font-black text-lg text-amber-400">${totalPendingMonthly.toLocaleString("es-AR")}</h4>
                  <p className="text-[10px] text-slate-400">Suma pendiente</p>
                </div>
              </div>

              {/* Header with registration button */}
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Historial de Pagos</h3>
                <button
                  onClick={() => setShowPagoModal(true)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Pago</span>
                </button>
              </div>

              {/* Payments History List */}
              {pagos.filter(p => !viewingPaymentUserUid || p.fields["fld8AfJf3bk7Gmd9p"] === viewingPaymentUserUid).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs p-6">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700 text-xs">No hay pagos registrados</h4>
                  <p className="text-[10px] text-slate-400">Registrá una cuota mensual o pago de clase para llevar la contabilidad.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pagos
                    .filter(p => !viewingPaymentUserUid || p.fields["fld8AfJf3bk7Gmd9p"] === viewingPaymentUserUid)
                    .map((pago) => {
                      const clientName = connectionsResolveName(conexiones, pago.fields["fld8AfJf3bk7Gmd9p"]) || pago.fields["fldIPTOUzeUmPWidy"] || "Alumno";
                      const isPendingValidation = pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario";
                      
                      return (
                        <div key={pago.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-800 truncate">{pago.fields["fldbCYf6VCk0hbatz"]}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Alumno: <strong className="text-slate-700">{clientName}</strong></p>
                            </div>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Trainer" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              pago.fields["fldZdQmdRurKxtAuu"] === "Rechazado" ? "bg-red-50 text-red-700 border border-red-100" :
                              "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                            }`}>
                              {pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Trainer" ? "Confirmado" :
                               pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario" ? "Por validar" :
                               pago.fields["fldZdQmdRurKxtAuu"] === "Rechazado" ? "Rechazado" : "Pendiente"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-50 pt-2 bg-slate-50/50 -mx-3.5 px-3.5 rounded-b-xl">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#7C3AED]">{pago.fields["fldWwQdbygtWGNpoP"]}</span>
                              <span>•</span>
                              <span>{pago.fields["fldYpQijiVfc3H04k"] || pago.fields["fldA7WKj2hQ1DavUy"]?.split("T")[0]}</span>
                            </div>
                            <span className="font-black text-slate-800 text-xs">${pago.fields["fldgNjpumZClUVDJ6"]}</span>
                          </div>

                          {/* Validation Callout for Trainer if client claims payment */}
                          {isPendingValidation && (
                            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 flex flex-col gap-2">
                              <div className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold">
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>El alumno declaró realizar el pago.</span>
                              </div>
                              {pago.fields["fldAH4HoM02wHZXP3"] && (
                                <a
                                  href={pago.fields["fldAH4HoM02wHZXP3"]}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-[#7C3AED] hover:underline font-bold"
                                >
                                  Ver Comprobante Adjunto ↗
                                </a>
                              )}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleValidatePayment(pago.id, true)}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg font-bold text-[9px] cursor-pointer"
                                >
                                  Validar Pago
                                </button>
                                <button
                                  onClick={() => handleValidatePayment(pago.id, false)}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg font-bold text-[9px] cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Note banner */}
              <div className="p-3 bg-purple-50 text-slate-600 text-[10px] font-bold flex items-center gap-1.5 rounded-xl border border-purple-100">
                <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Recomendamos siempre solicitar y guardar comprobantes de pago.</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODALS */}

      {/* A. INVITE CLIENT MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[380px] p-5 shadow-xl space-y-4 text-slate-800">
            <div className="flex justify-between items-start">
              <h4 className="font-extrabold text-sm text-slate-800">Invitar Nuevo Alumno</h4>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleInviteClient} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Clara Gomez"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Email del Alumno</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Notas Iniciales (Opcional)</label>
                <textarea
                  placeholder="Indicar horarios de entrenamiento acordados, etc."
                  value={inviteNotes}
                  onChange={e => setInviteNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#7C3AED] text-white py-2 rounded-xl font-bold text-xs"
              >
                {actionLoading ? "Enviando..." : "Enviar Invitación"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B. NEW / EDIT CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800 no-scrollbar">
            <div className="flex justify-between items-start">
              <h4 className="font-extrabold text-sm text-slate-800">{editingClassId ? "Editar Clase" : "Programar Nueva Clase"}</h4>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Título de la Clase / Sesión</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Funcional Grupal Parque"
                  value={classForm["fld87QH0tdReGaKLT"] || ""}
                  onChange={e => setClassForm({ ...classForm, "fld87QH0tdReGaKLT": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Visibilidad</label>
                <select
                  value={classForm["fldye17iriK8T181P""] || (classForm as any)["Visibilidad"] || "Pública"}
                  onChange={e => setClassForm({ ...classForm, "fldye17iriK8T181P"": e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="Pública">Públicas — En perfil público (cualquiera puede solicitar)</option>
                  <option value="Profesional privada">Profesional privada — Solo panel (invitación directa)</option>
                  <option value="Rutina personal">Rutina personal — "Mi Entrenamiento" (sin alumnos)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                  <select
                    value={classForm["fldULIptbbqkM1pJZ"] || "Clase grupal"}
                    onChange={e => setClassForm({ ...classForm, "fldULIptbbqkM1pJZ": e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                  >
                    <option value="Clase grupal">Clase Grupal</option>
                    <option value="Sesion individual">Sesión Individual</option>
                    <option value="Rutina online">Rutina Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Disciplina</label>
                  <select
                    value={classForm["fldGVEVEy6iIpwb9b"] || "Gimnasio"}
                    onChange={e => setClassForm({ ...classForm, "fldGVEVEy6iIpwb9b": e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                  >
                    {["Futbol", "Gimnasio", "Running", "Basquet", "Funcional", "Yoga-Pilates", "Natacion", "Ciclismo", "Atletismo", "Boxeo", "Otro"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    required
                    value={classForm["fld5GqA8PNqmIFJrp"] || ""}
                    onChange={e => setClassForm({ ...classForm, "fld5GqA8PNqmIFJrp": e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Duración (Minutos)</label>
                  <input
                    type="number"
                    required
                    value={classForm["fldvzS4FE93uzNHMY"] || 60}
                    onChange={e => setClassForm({ ...classForm, "fldvzS4FE93uzNHMY": Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Precio ($ AR)</label>
                  <input
                    type="number"
                    required
                    value={classForm["fldVYzxNcAP93MAkA"] || 0}
                    onChange={e => setClassForm({ ...classForm, "fldVYzxNcAP93MAkA": Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Cupo Máximo</label>
                  <input
                    type="number"
                    required
                    value={classForm["fldh1XAPkKdfTnVEB"] || 10}
                    onChange={e => setClassForm({ ...classForm, "fldh1XAPkKdfTnVEB": Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Lugar / Ubicación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Costanera o Gimnasio Elite"
                  value={classForm["fld3bk5b2r4FCpy8d"] || ""}
                  onChange={e => setClassForm({ ...classForm, "fld3bk5b2r4FCpy8d": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Descripción de la Clase</label>
                <textarea
                  placeholder="¿De qué trata? Elementos necesarios, etc."
                  value={classForm["fldwUwWi8eU8vXUfI"] || ""}
                  onChange={e => setClassForm({ ...classForm, "fldwUwWi8eU8vXUfI": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#7C3AED] text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                {actionLoading ? "Guardando..." : "Guardar Clase"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* D. MANAGE STUDENTS MODAL */}
      {selectedClassDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800 no-scrollbar">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">{selectedClassDetail.fields["fld87QH0tdReGaKLT"]}</h4>
                <p className="text-[10px] text-slate-500">Gestión de Alumnos y Solicitudes</p>
              </div>
              <button onClick={() => setSelectedClassDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invite directly by email */}
            <form onSubmit={(e) => handleInviteStudentToClass(e, selectedClassDetail.id)} className="bg-purple-50 p-3 rounded-xl border border-purple-100 space-y-2">
              <label className="block text-[10px] font-bold text-purple-900 uppercase">Invitar Alumno por Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="email@alumno.com"
                  value={classInviteEmail}
                  onChange={e => setClassInviteEmail(e.target.value)}
                  className="flex-1 bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#7C3AED] outline-none"
                />
                <button
                  type="submit"
                  disabled={classInviteLoading}
                  className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
                >
                  {classInviteLoading ? "..." : "Invitar"}
                </button>
              </div>
            </form>

            {/* Pending Requests */}
            {(() => {
              const pendingUids = (selectedClassDetail.fields["fldMhg6dIVBz4zndi"] || (selectedClassDetail.fields as any)["Usuarios_Pendientes"] || "").split(",").map(s => s.trim()).filter(Boolean);
              if (pendingUids.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Solicitudes Pendientes ({pendingUids.length})
                  </h5>
                  <div className="space-y-1.5">
                    {pendingUids.map(uid => {
                      const name = connectionsResolveName(conexiones, uid) || uid;
                      return (
                        <div key={uid} className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{name}</span>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleApproveStudent(selectedClassDetail.id, uid)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectStudent(selectedClassDetail.id, uid)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-[10px] cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Enrolled Students */}
            {(() => {
              const signedUpUids = (selectedClassDetail.fields["fldVHgp4Ncfhz87HV"] || "").split(",").map(s => s.trim()).filter(Boolean);
              return (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Alumnos Confirmados ({signedUpUids.length} / {selectedClassDetail.fields["fldh1XAPkKdfTnVEB"] || "Sin límite"})
                  </h5>
                  {signedUpUids.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay alumnos confirmados todavía.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {signedUpUids.map(uid => {
                        const name = connectionsResolveName(conexiones, uid) || uid;
                        return (
                          <div key={uid} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">{name}</span>
                            <button
                              onClick={() => handleRemoveStudent(selectedClassDetail.id, uid)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Waitlist */}
            {(() => {
              const waitlistUids = (selectedClassDetail.fields["fldAIHxWGe33npWxZ"] || (selectedClassDetail.fields as any)["Usuarios_Espera"] || "").split(",").map(s => s.trim()).filter(Boolean);
              if (waitlistUids.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    Lista de Espera ({waitlistUids.length})
                  </h5>
                  <div className="space-y-1.5">
                    {waitlistUids.map(uid => {
                      const name = connectionsResolveName(conexiones, uid) || uid;
                      return (
                        <div key={uid} className="bg-purple-50/50 p-2 rounded-lg border border-purple-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
                          <button
                            onClick={() => handleApproveStudent(selectedClassDetail.id, uid)}
                            disabled={actionLoading}
                            className="px-2 py-1 bg-emerald-500 text-white rounded font-bold text-[10px] cursor-pointer"
                          >
                            Aprobar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* C. MANUAL REGISTER PAYMENT MODAL */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[380px] p-5 shadow-xl space-y-4 text-slate-800">
            <div className="flex justify-between items-start">
              <h4 className="font-extrabold text-sm text-slate-800">Registrar Pago Manual</h4>
              <button onClick={() => setShowPagoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Seleccionar Alumno</label>
                <select
                  required
                  value={pagoForm["fld8AfJf3bk7Gmd9p"] || ""}
                  onChange={e => setPagoForm({ ...pagoForm, "fld8AfJf3bk7Gmd9p": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                >
                  <option value="">-- Elegir alumno --</option>
                  {activeAlumnos.map(al => (
                    <option key={al.fields["fldmYw6VU51sfz62t"]} value={al.fields["fldmYw6VU51sfz62t"]}>
                      {al.fields["fldw4Jwc7kq6SUz3n"]} ({al.fields["fldDQqgDWLEknzPAm"]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mensualidad Junio Clara"
                  value={pagoForm["fldbCYf6VCk0hbatz"] || ""}
                  onChange={e => setPagoForm({ ...pagoForm, "fldbCYf6VCk0hbatz": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto ($ AR)</label>
                  <input
                    type="number"
                    required
                    value={pagoForm["fldgNjpumZClUVDJ6"] || 4000}
                    onChange={e => setPagoForm({ ...pagoForm, "fldgNjpumZClUVDJ6": Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                  <select
                    value={pagoForm["fldWwQdbygtWGNpoP"] || "Sesion"}
                    onChange={e => setPagoForm({ ...pagoForm, "fldWwQdbygtWGNpoP": e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                  >
                    <option value="Sesion">Sesión</option>
                    <option value="Mensualidad">Mensualidad</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Pago</label>
                <input
                  type="date"
                  required
                  value={pagoForm["fldYpQijiVfc3H04k"] || ""}
                  onChange={e => setPagoForm({ ...pagoForm, "fldYpQijiVfc3H04k": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Notas internas</label>
                <textarea
                  placeholder="Recordatorios de pago en efectivo, transferencia bancaria, etc."
                  value={pagoForm["fldmFXp6KAvI0yS8U"] || ""}
                  onChange={e => setPagoForm({ ...pagoForm, "fldmFXp6KAvI0yS8U": e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs h-14 focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#7C3AED] text-white py-2 rounded-xl font-bold text-xs"
              >
                {actionLoading ? "Registrando..." : "Registrar Pago"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
function connectionsResolveName(connections: ConexionRecord[], userUid: string): string {
  const c = connections.find(item => item.fields["fldmYw6VU51sfz62t"] === userUid);
  return c ? c.fields["fldw4Jwc7kq6SUz3n"] : "";
}
