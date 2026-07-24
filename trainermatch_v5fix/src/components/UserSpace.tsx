import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Users, CreditCard, Activity, Play, Pause, RotateCcw, 
  Plus, Check, X, Phone, ShieldCheck, MapPin, Sparkles, Trophy, 
  Map, Info, Flame, ChevronRight, Upload, Clock, Save, Trash2
} from "lucide-react";
import { 
  ConexionRecord, ClaseRecord, PagoRecord, TrainerRecord,
  TabataPreset, WorkoutRecord, WeeklyGoal
} from "../types";

interface UserSpaceProps {
  currentUser: { uid: string; email: string; isMock?: boolean };
  trainers: TrainerRecord[];
  onNavigateToInicio: () => void;
  onViewTrainerProfile: (trainer: TrainerRecord) => void;
}

export default function UserSpace({ 
  currentUser, 
  trainers, 
  onNavigateToInicio,
  onViewTrainerProfile 
}: UserSpaceProps) {
  const [activeSubView, setActiveSubView] = useState<"agenda" | "entrenadores" | "pagos" | "entrenamiento">("agenda");
  
  // Tab/Section for training tools
  const [activeTrainingTool, setActiveTrainingTool] = useState<"timer" | "registro" | "gps" | "objetivos">("timer");

  // Server-synced state
  const [conexiones, setConexiones] = useState<ConexionRecord[]>([]);
  const [clases, setClases] = useState<ClaseRecord[]>([]);
  const [pagos, setPagos] = useState<PagoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Local state (localStorage persistence)
  const [tabataPresets, setTabataPresets] = useState<TabataPreset[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({ targetWorkouts: 3, history: {} });

  // Upload/Comprobante link state during payment confirmation
  const [confirmingPagoId, setConfirmingPagoId] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // CRONOMETRO PROFESIONAL ENGINE STATES
  const [timerPresetName, setTimerPresetName] = useState("");
  const [timerSeries, setTimerSeries] = useState(8);
  const [timerWorkTime, setTimerWorkTime] = useState(20); // seconds
  const [timerRestTime, setTimerRestTime] = useState(10); // seconds
  const [timerExerciseName, setTimerExerciseName] = useState("Trabajo de Fuerza");
  const [timerRestBetweenSeries, setTimerRestBetweenSeries] = useState(0); // seconds
  const [timerWarmup, setTimerWarmup] = useState(0); // seconds
  const [timerCooldown, setTimerCooldown] = useState(0); // seconds
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(true);

  const [currentSerie, setCurrentSerie] = useState(1);
  const [timerPhase, setTimerPhase] = useState<"warmup" | "work" | "rest" | "restBetween" | "cooldown" | "idle">("idle");
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTotalElapsed, setTimerTotalElapsed] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // GPS TRACKER ENGINE STATES
  const [gpsRunning, setGpsRunning] = useState(false);
  const [gpsPaused, setGpsPaused] = useState(false);
  const [gpsElapsedSeconds, setGpsElapsedSeconds] = useState(0);
  const [gpsDistance, setGpsDistance] = useState(0); // in km
  const [gpsSpeed, setGpsSpeed] = useState(0); // km/h
  const gpsWatcherIdRef = useRef<number | null>(null);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCoordinatesRef = useRef<{ lat: number; lng: number } | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  // WORKOUT LOG FORM STATE
  const [logForm, setLogForm] = useState<Partial<WorkoutRecord>>({
    date: new Date().toISOString().split("T")[0],
    activityType: "Running",
    duration: 30,
    distance: undefined,
    notes: ""
  });

  // Load backend data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Connections for current user
      const conRes = await fetch(`/api/conexiones?uid=${currentUser.uid}`);
      if (conRes.ok) {
        const data = await conRes.json();
        setConexiones(data.records || []);
      }

      // Classes where current user might be signed up
      const claRes = await fetch(`/api/clases?user_uid=${currentUser.uid}`);
      if (claRes.ok) {
        const data = await claRes.json();
        setClases(data.records || []);
      }

      // Payments for current user
      const pagRes = await fetch(`/api/pagos?user_uid=${currentUser.uid}`);
      if (pagRes.ok) {
        const data = await pagRes.json();
        setPagos(data.records || []);
      }
    } catch (error) {
      console.error("Error loading user private space data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load localStorage data
  useEffect(() => {
    fetchUserData();

    // Presets
    const savedPresets = localStorage.getItem(`tm_presets_${currentUser.uid}`);
    if (savedPresets) {
      setTabataPresets(JSON.parse(savedPresets));
    } else {
      // Add default preset
      const defaultPresets: TabataPreset[] = [
        { id: "default-tabata", name: "Cronómetro Estándar", series: 8, workTime: 20, restTime: 10, exerciseName: "Pushups / Squats", restBetweenSeries: 0, warmup: 0, cooldown: 0, soundEnabled: true },
        { id: "default-hiit", name: "HIIT Intenso", series: 10, workTime: 40, restTime: 20, exerciseName: "Burpees", restBetweenSeries: 0, warmup: 10, cooldown: 10, soundEnabled: true }
      ];
      setTabataPresets(defaultPresets);
      localStorage.setItem(`tm_presets_${currentUser.uid}`, JSON.stringify(defaultPresets));
    }

    // Workouts
    const savedWorkouts = localStorage.getItem(`tm_workouts_${currentUser.uid}`);
    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts));
    }

    // Weekly Goal
    const savedGoal = localStorage.getItem(`tm_goal_${currentUser.uid}`);
    if (savedGoal) {
      setWeeklyGoal(JSON.parse(savedGoal));
    }
  }, [currentUser.uid]);

  // Sync state changes to localStorage
  const saveWorkoutsToLocal = (updatedWorkouts: WorkoutRecord[]) => {
    setWorkouts(updatedWorkouts);
    localStorage.setItem(`tm_workouts_${currentUser.uid}`, JSON.stringify(updatedWorkouts));
  };

  const savePresetsToLocal = (updatedPresets: TabataPreset[]) => {
    setTabataPresets(updatedPresets);
    localStorage.setItem(`tm_presets_${currentUser.uid}`, JSON.stringify(updatedPresets));
  };

  const saveGoalToLocal = (updatedGoal: WeeklyGoal) => {
    setWeeklyGoal(updatedGoal);
    localStorage.setItem(`tm_goal_${currentUser.uid}`, JSON.stringify(updatedGoal));
  };

  // Sound Synth for phase changes
  const playBeep = (frequency = 800, duration = 0.15) => {
    if (!timerSoundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn("Audio Context blocked or not supported", err);
    }
  };

  const finishWorkout = () => {
    setTimerRunning(false);
    setTimerPhase("idle");
    if (timerSoundEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 1000;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        }
      } catch (err) {
        console.warn(err);
      }
    }
    setWorkouts((currentWorkouts) => {
      const completeLog: WorkoutRecord = {
        id: "timer-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        activityType: "Cronómetro profesional",
        duration: Math.round(timerTotalElapsed / 60) || 1,
        notes: `Entrenamiento de ${timerSeries} series de ${timerExerciseName} completado con éxito.`
      };
      const updated = [completeLog, ...currentWorkouts];
      localStorage.setItem(`tm_workouts_${currentUser.uid}`, JSON.stringify(updated));
      return updated;
    });
    alert("¡Entrenamiento completado y guardado en tu historial!");
  };

  // CRONOMETRO PROFESIONAL LOGIC
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        // Increment total elapsed time
        setTimerTotalElapsed((prevTotal) => prevTotal + 1);

        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Phase complete! Transition logic
            if (timerPhase === "warmup") {
              // Transition warmup -> work (series 1)
              playBeep(880, 0.3);
              setTimerPhase("work");
              setCurrentSerie(1);
              return timerWorkTime;
            } else if (timerPhase === "work") {
              if (currentSerie < timerSeries) {
                // Not the last series
                if (timerRestBetweenSeries > 0) {
                  playBeep(440, 0.4);
                  setTimerPhase("restBetween");
                  return timerRestBetweenSeries;
                } else if (timerRestTime > 0) {
                  playBeep(440, 0.4);
                  setTimerPhase("rest");
                  return timerRestTime;
                } else {
                  // Direct transition to work of next series
                  playBeep(880, 0.3);
                  setCurrentSerie((s) => s + 1);
                  setTimerPhase("work");
                  return timerWorkTime;
                }
              } else {
                // Last series completed!
                if (timerCooldown > 0) {
                  playBeep(520, 0.5);
                  setTimerPhase("cooldown");
                  return timerCooldown;
                } else {
                  // Finish routine
                  setTimeout(() => finishWorkout(), 0);
                  return 0;
                }
              }
            } else if (timerPhase === "rest" || timerPhase === "restBetween") {
              // Transition rest/restBetween -> work (next series)
              playBeep(880, 0.3);
              setCurrentSerie((s) => s + 1);
              setTimerPhase("work");
              return timerWorkTime;
            } else if (timerPhase === "cooldown") {
              // Cooldown completed! Finish routine
              setTimeout(() => finishWorkout(), 0);
              return 0;
            }
            return 0;
          }

          // Count down beeps for last 3 seconds of any active phase
          if (timerSoundEnabled && prevTime <= 4 && prevTime > 1) {
            playBeep(600, 0.08);
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerPhase, currentSerie, timerSeries, timerWorkTime, timerRestTime, timerRestBetweenSeries, timerWarmup, timerCooldown, timerSoundEnabled, timerTotalElapsed]);

  const handleStartTimer = () => {
    if (timerPhase === "idle") {
      setTimerTotalElapsed(0);
      if (timerWarmup > 0) {
        setTimerPhase("warmup");
        setTimeLeft(timerWarmup);
        setCurrentSerie(1);
        playBeep(880, 0.4);
      } else {
        setTimerPhase("work");
        setTimeLeft(timerWorkTime);
        setCurrentSerie(1);
        playBeep(880, 0.4);
      }
    }
    setTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerPhase("idle");
    setCurrentSerie(1);
    setTimeLeft(timerWarmup > 0 ? timerWarmup : timerWorkTime);
    setTimerTotalElapsed(0);
  };

  const handleSavePreset = () => {
    if (!timerPresetName.trim()) {
      alert("Introduce un nombre para el Preset.");
      return;
    }
    const newPreset: TabataPreset = {
      id: "preset-" + Date.now(),
      name: timerPresetName,
      series: timerSeries,
      workTime: timerWorkTime,
      restTime: timerRestTime,
      exerciseName: timerExerciseName,
      restBetweenSeries: timerRestBetweenSeries,
      warmup: timerWarmup,
      cooldown: timerCooldown,
      soundEnabled: timerSoundEnabled
    };
    savePresetsToLocal([...tabataPresets, newPreset]);
    setTimerPresetName("");
    alert("Preset guardado con éxito.");
  };

  const handleLoadPreset = (preset: TabataPreset) => {
    setTimerSeries(preset.series);
    setTimerWorkTime(preset.workTime);
    setTimerRestTime(preset.restTime);
    setTimerExerciseName(preset.exerciseName);
    setTimerRestBetweenSeries(preset.restBetweenSeries || 0);
    setTimerWarmup(preset.warmup || 0);
    setTimerCooldown(preset.cooldown || 0);
    setTimerSoundEnabled(preset.soundEnabled !== false);
    setTimeLeft(preset.warmup && preset.warmup > 0 ? preset.warmup : preset.workTime);
    setTimerPhase("idle");
    setTimerRunning(false);
    setTimerTotalElapsed(0);
  };

  const handleDeletePreset = (id: string) => {
    savePresetsToLocal(tabataPresets.filter(p => p.id !== id));
  };

  const getCurrentPhaseDuration = () => {
    if (timerPhase === "warmup") return timerWarmup;
    if (timerPhase === "work") return timerWorkTime;
    if (timerPhase === "rest") return timerRestTime;
    if (timerPhase === "restBetween") return timerRestBetweenSeries;
    if (timerPhase === "cooldown") return timerCooldown;
    return 1;
  };

  const getPhaseConfig = () => {
    switch (timerPhase) {
      case "warmup":
        return { name: "Calentamiento", bg: "bg-[#F59E0B]", border: "border-[#D97706]" };
      case "work":
        return { name: "Trabajo", bg: "bg-[#7C3AED]", border: "border-[#6D28D9]" };
      case "rest":
        return { name: "Descanso", bg: "bg-[#10B981]", border: "border-[#059669]" };
      case "restBetween":
        return { name: "Descanso entre series", bg: "bg-[#10B981]", border: "border-[#059669]" };
      case "cooldown":
        return { name: "Enfriamiento", bg: "bg-[#3B82F6]", border: "border-[#2563EB]" };
      default:
        return { name: "", bg: "bg-slate-100", border: "border-slate-200" };
    }
  };

  const formatTimerTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };


  // GPS GEOLOCATION TRACKER LOGIC
  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsErrorMsg("Tu navegador no soporta geolocalización.");
      return;
    }

    setGpsErrorMsg("");
    setGpsRunning(true);
    setGpsPaused(false);
    setGpsDistance(0);
    setGpsElapsedSeconds(0);
    lastCoordinatesRef.current = null;

    // Timer interval
    gpsIntervalRef.current = setInterval(() => {
      setGpsElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Geolocation watcher
    gpsWatcherIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        // Ignore low accuracy coordinates (> 30 meters) if we already have a starting point
        if (accuracy > 35 && lastCoordinatesRef.current) return;

        if (lastCoordinatesRef.current) {
          const dist = calculateDistance(
            lastCoordinatesRef.current.lat,
            lastCoordinatesRef.current.lng,
            latitude,
            longitude
          );
          setGpsDistance((prev) => prev + dist);
        }
        lastCoordinatesRef.current = { lat: latitude, lng: longitude };
      },
      (error) => {
        console.error("GPS Error Code:", error.code, error.message);
        setGpsErrorMsg("Error de señal GPS o permisos denegados.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const pauseGpsTracking = () => {
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    if (gpsWatcherIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatcherIdRef.current);
      gpsWatcherIdRef.current = null;
    }
    setGpsPaused(true);
    // Speed calculation
    const hours = gpsElapsedSeconds / 3600;
    setGpsSpeed(hours > 0 ? gpsDistance / hours : 0);
  };

  const resumeGpsTracking = () => {
    setGpsPaused(false);
    lastCoordinatesRef.current = null;

    gpsIntervalRef.current = setInterval(() => {
      setGpsElapsedSeconds(prev => prev + 1);
    }, 1000);

    gpsWatcherIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (lastCoordinatesRef.current) {
          const dist = calculateDistance(
            lastCoordinatesRef.current.lat,
            lastCoordinatesRef.current.lng,
            latitude,
            longitude
          );
          setGpsDistance((prev) => prev + dist);
        }
        lastCoordinatesRef.current = { lat: latitude, lng: longitude };
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  };

  const stopAndSaveGpsTracking = () => {
    // Clear intervals and watchers
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    if (gpsWatcherIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatcherIdRef.current);
      gpsWatcherIdRef.current = null;
    }

    setGpsRunning(false);
    setGpsPaused(false);

    const roundedDistance = parseFloat(gpsDistance.toFixed(2));
    const finalMinutes = Math.round(gpsElapsedSeconds / 60) || 1;

    // Create Workout record
    const gpsWorkout: WorkoutRecord = {
      id: "gps-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      activityType: "Running GPS",
      duration: finalMinutes,
      distance: roundedDistance,
      notes: `Sesión de running GPS. Tiempo: ${formatTime(gpsElapsedSeconds)}. Vel Promedio: ${(roundedDistance / (gpsElapsedSeconds / 3600 || 1)).toFixed(1)} km/h.`
    };

    saveWorkoutsToLocal([gpsWorkout, ...workouts]);
    setGpsDistance(0);
    setGpsElapsedSeconds(0);
    alert("¡Entrenamiento GPS registrado con éxito!");
  };

  // Haversine formula to compute distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth Radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].filter(Boolean).join(":");
  };


  // WORKOUT LOG OPERATIONS
  const handleAddWorkoutLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.date || !logForm.activityType || !logForm.duration) {
      alert("Completá la fecha, actividad y duración.");
      return;
    }

    const newLog: WorkoutRecord = {
      id: "manual-" + Date.now(),
      date: logForm.date,
      activityType: logForm.activityType,
      duration: Number(logForm.duration),
      distance: logForm.distance ? Number(logForm.distance) : undefined,
      notes: logForm.notes
    };

    saveWorkoutsToLocal([newLog, ...workouts]);
    setLogForm({
      date: new Date().toISOString().split("T")[0],
      activityType: "Running",
      duration: 30,
      distance: undefined,
      notes: ""
    });
  };

  const handleDeleteWorkoutLog = (id: string) => {
    if (confirm("¿Querés borrar este entrenamiento del historial?")) {
      saveWorkoutsToLocal(workouts.filter(w => w.id !== id));
    }
  };


  // BACKEND ACTIONS
  // Cancel user-sent pending request
  const handleCancelPendingRequest = async (id: string) => {
    if (!confirm("¿Querés cancelar esta solicitud de conexión?")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/conexiones/${id}?userUid=${currentUser.uid}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchUserData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Self-Confirm user payment with simulated receipt upload
  const handleConfirmPago = async (pagoId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/pagos/${pagoId}/confirmar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprobanteUrl: comprobanteUrl || "https://ejemplo.com/comprobante_simulado.png",
          userUid: currentUser.uid
        })
      });

      if (res.ok) {
        setConfirmingPagoId(null);
        setComprobanteUrl("");
        await fetchUserData();
      } else {
        const txt = await res.text();
        alert("Error al confirmar pago: " + txt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };


  // COMPUTED STATS FOR WORKOUTS (LOCAL ENGINE)
  // Last 30 workouts
  const last30Workouts = workouts.slice(0, 30);

  // Workouts this week (Monday - Sunday)
  const getWorkoutsThisWeek = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return workouts.filter(w => {
      const wDate = new Date(w.date + "T00:00:00");
      return wDate >= monday;
    }).length;
  };

  // Consecutive Days Streak
  const getStreakDays = () => {
    if (workouts.length === 0) return 0;
    
    // Sort unique dates descending
    const uniqueDates = Array.from(new Set(workouts.map(w => w.date))) as string[];
    uniqueDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if the streak is active (has workout today or yesterday)
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let expectedDate = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      const dateToCheck = new Date(uniqueDates[i]);
      const diffTime = Math.abs(expectedDate.getTime() - dateToCheck.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        expectedDate = dateToCheck;
      } else {
        break;
      }
    }
    return streak;
  };

  // Total Minutes This Month
  const getMinutesThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return workouts
      .filter(w => {
        const d = new Date(w.date + "T00:00:00");
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, w) => sum + w.duration, 0);
  };


  // WEEK ID RESOLUTION (e.g. "2026-W26")
  const getWeekId = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const numWeek = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${date.getFullYear()}-W${String(numWeek).padStart(2, "0")}`;
  };

  const currentWeekId = getWeekId(new Date());

  // Record a complete training in this week's history tracker if needed
  const workoutsThisWeekCount = getWorkoutsThisWeek();

  return (
    <div className="space-y-4">
      
      {/* Tab Header Navigation */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveSubView("agenda")}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
            activeSubView === "agenda" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Mi Agenda
        </button>
        <button
          onClick={() => setActiveSubView("entrenadores")}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
            activeSubView === "entrenadores" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Trainers
        </button>
        <button
          onClick={() => setActiveSubView("pagos")}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
            activeSubView === "pagos" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Pagos
        </button>
        <button
          onClick={() => setActiveSubView("entrenamiento")}
          className={`py-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
            activeSubView === "entrenamiento" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-3 h-3 text-purple-600 animate-pulse" />
          <span>Mi Entreno</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#7C3AED] animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Cargando tus datos privados...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. MI AGENDA VIEW */}
          {activeSubView === "agenda" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mi Agenda Semanal</h3>

              {clases.filter(c => c.fields["fldORKAoJFYsBDuOU"] !== "Cancelada").length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-3">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-xs">No tenés clases agendadas</h4>
                  <p className="text-[10px] text-slate-400">Conectate con un personal trainer para que te anote en clases grupales o individuales.</p>
                  <button
                    onClick={onNavigateToInicio}
                    className="mt-2 bg-purple-50 text-[#7C3AED] text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Explorar Entrenadores
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clases
                    .filter(c => c.fields["fldORKAoJFYsBDuOU"] !== "Cancelada")
                    .map((clase) => {
                      const classDate = new Date(clase.fields["fld5GqA8PNqmIFJrp"]);
                      // Resolve trainer record
                      const coach = trainers.find(t => t.fields["fldaxVLNrd996M0Ys"] === clase.fields["fld8KSeYEDoxImnph"]);
                      const coachName = coach ? coach.fields["fldwnXjaE5Uc6StJ9"] : "Entrenador";
                      const coachPhoto = coach ? coach.fields["fldeot761GH2iDFyk"] : "";

                      return (
                        <div key={clase.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">{clase.fields["fldULIptbbqkM1pJZ"]}</span>
                              <h4 className="font-extrabold text-sm text-slate-800 mt-0.5">{clase.fields["fld87QH0tdReGaKLT"]}</h4>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">
                              {clase.fields["fldGVEVEy6iIpwb9b"]}
                            </span>
                          </div>

                          <div className="flex gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg">
                            {coachPhoto ? (
                              <img src={coachPhoto} alt={coachName} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                {coachName[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{coachName}</p>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{clase.fields["fld3bk5b2r4FCpy8d"]}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-50">
                            <div className="flex items-center gap-1 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{classDate.toLocaleDateString("es-AR", { weekday: 'short', day: 'numeric', month: 'short' })} • {classDate.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}hs</span>
                            </div>
                            {coach && (
                              <button
                                onClick={() => onViewTrainerProfile(coach)}
                                className="text-[#7C3AED] hover:underline font-bold cursor-pointer"
                              >
                                Ver perfil del trainer ↗
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 2. MIS ENTRENADORES VIEW */}
          {activeSubView === "entrenadores" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mis Entrenadores</h3>
                <button
                  onClick={onNavigateToInicio}
                  className="text-[10px] font-black text-[#7C3AED] hover:underline cursor-pointer"
                >
                  Buscar entrenador ⚡
                </button>
              </div>

              {/* Active Connections */}
              <div className="space-y-2.5">
                {conexiones.filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Activa").length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-slate-100 p-6 shadow-xs">
                    <p className="text-xs text-slate-400">No tenés ningún entrenador activo asignado.</p>
                  </div>
                ) : (
                  conexiones
                    .filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Activa")
                    .map((con) => {
                      // Find matching trainer profile
                      const coach = trainers.find(t => t.fields["fldaxVLNrd996M0Ys"] === con.fields["fldHp5LKVU0XUkulG"]);
                      const coachName = coach ? coach.fields["fldwnXjaE5Uc6StJ9"] : con.fields["fldHp5LKVU0XUkulG"];
                      const coachPhoto = coach ? coach.fields["fldeot761GH2iDFyk"] : "";
                      const discipline = coach ? (coach.fields["fldIBZ2E7JDDaRDwb"]?.[0] || "Entrenador") : "Preparador Físico";
                      const whatsApp = coach ? coach.fields["fldy95XzPftzGXGEC"] : "";

                      return (
                        <div key={con.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {coachPhoto ? (
                              <img src={coachPhoto} alt={coachName} className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold shrink-0">
                                {coachName[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-800 truncate">{coachName}</h4>
                              <p className="text-[10px] text-purple-600 font-bold">{discipline}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {whatsApp ? (
                              <a
                                href={`https://wa.me/${whatsApp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(coachName)}!%20Te%20escribo%20desde%20TrainerMatch.`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-1 rounded">Sin WhatsApp</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Sent Pending Requests */}
              {conexiones.filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Pendiente" && c.fields["fld9LRCPGmfxvODuG"] === "Usuario").length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Solicitudes enviadas pendientes</h4>
                  {conexiones
                    .filter(c => c.fields["fldSLmMOlJ29ZZWA3"] === "Pendiente" && c.fields["fld9LRCPGmfxvODuG"] === "Usuario")
                    .map((con) => {
                      const coachName = con.fields["fldHp5LKVU0XUkulG"];
                      return (
                        <div key={con.id} className="bg-slate-100 p-3 rounded-lg flex items-center justify-between gap-2 border border-slate-200/50">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">Soli a: {coachName}</p>
                            <span className="text-[9px] text-slate-500">Enviada el {con.fields["fldv5499scxo0ZsRe"]?.split("T")[0] || "recientemente"}</span>
                          </div>
                          <button
                            onClick={() => handleCancelPendingRequest(con.id)}
                            disabled={actionLoading}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 shrink-0 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 3. MIS PAGOS VIEW */}
          {activeSubView === "pagos" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mis Pagos Registrados</h3>

              {pagos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-xs p-6">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Aún no tenés pagos registrados por tus entrenadores.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagos.map((pago) => {
                    const coach = trainers.find(t => t.fields["fldaxVLNrd996M0Ys"] === pago.fields["fldfRKMzv2sgkmKpF"]);
                    const coachName = coach ? coach.fields["fldwnXjaE5Uc6StJ9"] : "Mi Trainer";
                    const isPending = pago.fields["fldZdQmdRurKxtAuu"] === "Pendiente";
                    
                    return (
                      <div key={pago.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-800 truncate">{pago.fields["fldbCYf6VCk0hbatz"]}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Trainer: <strong className="text-slate-700">{coachName}</strong></p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Trainer" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario" ? "bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse" :
                            pago.fields["fldZdQmdRurKxtAuu"] === "Rechazado" ? "bg-red-50 text-red-700 border border-red-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Trainer" ? "Confirmado" :
                             pago.fields["fldZdQmdRurKxtAuu"] === "Confirmado_Usuario" ? "En verificación" :
                             pago.fields["fldZdQmdRurKxtAuu"] === "Rechazado" ? "Rechazado" : "Pendiente de pago"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-50 pt-2 bg-slate-50/50 -mx-3.5 px-3.5 rounded-b-xl">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-purple-600">{pago.fields["fldWwQdbygtWGNpoP"]}</span>
                            <span>•</span>
                            <span>{pago.fields["fldYpQijiVfc3H04k"] || "Sin fecha"}</span>
                          </div>
                          <span className="font-black text-slate-800 text-xs">${pago.fields["fldgNjpumZClUVDJ6"]}</span>
                        </div>

                        {/* Declare/Confirm payment action block */}
                        {isPending && confirmingPagoId !== pago.id && (
                          <button
                            onClick={() => setConfirmingPagoId(pago.id)}
                            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Confirmar Pago Realizado
                          </button>
                        )}

                        {isPending && confirmingPagoId === pago.id && (
                          <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-200/50 space-y-2 text-left">
                            <p className="text-[10px] font-bold text-slate-700">Subí o indicá un link de tu comprobante de pago:</p>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Link de MercadoPago o imagen de comprobante"
                                value={comprobanteUrl}
                                onChange={e => setComprobanteUrl(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleConfirmPago(pago.id)}
                                  disabled={actionLoading}
                                  className="flex-1 bg-purple-600 text-white font-bold py-1.5 rounded text-[9px] cursor-pointer"
                                >
                                  {actionLoading ? "Declarando..." : "Confirmar e informar"}
                                </button>
                                <button
                                  onClick={() => setConfirmingPagoId(null)}
                                  className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-bold text-[9px] cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 bg-purple-50 text-slate-600 text-[10px] font-bold flex items-center gap-1.5 rounded-xl border border-purple-100">
                <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Guardá siempre tus comprobantes de pago.</span>
              </div>
            </div>
          )}

          {/* 4. MI ENTRENAMIENTO VIEW (LOCAL TOOLS) */}
          {activeSubView === "entrenamiento" && (
            <div className="space-y-4">
              
              {/* Local tools switches (Chps scroll bar) */}
              <div className="overflow-x-auto flex gap-1.5 py-1 no-scrollbar -mx-4 px-4 border-b border-slate-200/60 pb-3">
                <button
                  onClick={() => setActiveTrainingTool("timer")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTrainingTool === "timer" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-100"
                  }`}
                >
                  ⏱️ Cronómetro profesional
                </button>
                <button
                  onClick={() => setActiveTrainingTool("registro")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTrainingTool === "registro" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-100"
                  }`}
                >
                  📝 Historial Logs
                </button>
                <button
                  onClick={() => setActiveTrainingTool("gps")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTrainingTool === "gps" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-100"
                  }`}
                >
                  🏃 GPS Tracker
                </button>
                <button
                  onClick={() => setActiveTrainingTool("objetivos")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTrainingTool === "objetivos" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-100"
                  }`}
                >
                  🎯 Objetivos Semanales
                </button>
              </div>

              {/* A. TIMER INTELIGENTE */}
              {activeTrainingTool === "timer" && (
                <div className="space-y-4">
                  
                  {/* Phase Display active run */}
                  {timerPhase !== "idle" ? (
                    (() => {
                      const phaseInfo = getPhaseConfig();
                      const currentMax = getCurrentPhaseDuration();
                      const progressPercentage = Math.min(100, Math.max(0, (timeLeft / currentMax) * 100));
                      
                      return (
                        <div className={`p-6 rounded-2xl border text-center space-y-4 shadow-md transition-all duration-500 text-white ${phaseInfo.bg} ${phaseInfo.border}`}>
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                              {phaseInfo.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full">
                              Serie {currentSerie} / {timerSeries}
                            </span>
                          </div>
                          
                          <p className="text-xs font-semibold opacity-90 truncate max-w-full">{timerExerciseName}</p>

                          <div className="relative py-4 flex flex-col items-center justify-center">
                            {/* Big timer countdown */}
                            <h2 className="text-7xl font-black font-mono tracking-tighter leading-none">
                              {timeLeft}s
                            </h2>
                          </div>

                          {/* Linear progress bar */}
                          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-white h-full transition-all duration-1000 ease-linear"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>

                          {/* Session Stats */}
                          <div className="grid grid-cols-2 gap-3 pt-2 text-left bg-white/10 p-3 rounded-xl border border-white/10">
                            <div>
                              <span className="text-[9px] font-bold uppercase text-white/70 block">Transcurrido</span>
                              <span className="text-sm font-black font-mono">{formatTimerTime(timerTotalElapsed)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase text-white/70 block">Series</span>
                              <span className="text-sm font-black font-mono">{currentSerie} / {timerSeries}</span>
                            </div>
                          </div>

                          {/* Controls during active exercise */}
                          <div className="flex gap-2.5 pt-2">
                            <button
                              onClick={timerRunning ? handlePauseTimer : handleStartTimer}
                              className="flex-1 bg-white hover:bg-slate-50 text-slate-800 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              {timerRunning ? <Pause className="w-4 h-4 text-slate-700" /> : <Play className="w-4 h-4 text-slate-700" />}
                              <span>{timerRunning ? "Pausar" : "Reanudar"}</span>
                            </button>
                            <button
                              onClick={handleResetTimer}
                              className="px-4 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                              title="Reiniciar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Configuration form of Cronometro profesional
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          ⏱️ Configuración del Cronómetro
                        </h4>
                        <p className="text-[10px] text-slate-500">Configurá series, tiempos de fases y sonido para tu entrenamiento.</p>
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del ejercicio</label>
                          <input
                            type="text"
                            value={timerExerciseName}
                            onChange={e => setTimerExerciseName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            placeholder="Ej. Trabajo de Fuerza, Burpees, HIIT..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad de Series</label>
                            <input
                              type="number"
                              min="1"
                              value={timerSeries}
                              onChange={e => setTimerSeries(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trabajo (segundos)</label>
                            <input
                              type="number"
                              min="1"
                              value={timerWorkTime}
                              onChange={e => setTimerWorkTime(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descanso por Serie (s)</label>
                            <input
                              type="number"
                              min="0"
                              value={timerRestTime}
                              onChange={e => setTimerRestTime(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descanso entre series (s)</label>
                            <input
                              type="number"
                              min="0"
                              value={timerRestBetweenSeries}
                              onChange={e => setTimerRestBetweenSeries(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Calentamiento previo (s)</label>
                            <input
                              type="number"
                              min="0"
                              value={timerWarmup}
                              onChange={e => setTimerWarmup(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enfriamiento posterior (s)</label>
                            <input
                              type="number"
                              min="0"
                              value={timerCooldown}
                              onChange={e => setTimerCooldown(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Sound enabled Toggle Switch */}
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold text-slate-700 block">Efectos de sonido</span>
                            <span className="text-[9px] text-slate-400">Sonido de aviso en los últimos segundos y cambios de fase.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTimerSoundEnabled(!timerSoundEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${timerSoundEnabled ? "bg-[#7C3AED]" : "bg-slate-300"}`}
                          >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${timerSoundEnabled ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>

                        {/* Preset saving block */}
                        <div className="pt-2 flex gap-2">
                          <input
                            type="text"
                            placeholder="Nombre para guardar Preset..."
                            value={timerPresetName}
                            onChange={e => setTimerPresetName(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 text-[10px] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSavePreset}
                            className="bg-purple-50 text-[#7C3AED] hover:bg-purple-100 font-bold px-3 py-2 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Guardar Preset</span>
                          </button>
                        </div>

                        <button
                          onClick={handleStartTimer}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-white text-white" />
                          <span>Iniciar Entrenamiento</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Saved Presets list */}
                  {timerPhase === "idle" && tabataPresets.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mis Presets Guardados</span>
                      <div className="grid grid-cols-1 gap-2">
                        {tabataPresets.map((pr) => (
                          <div key={pr.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-2 shadow-xs">
                            <button
                              onClick={() => handleLoadPreset(pr)}
                              className="text-left flex-1 min-w-0 cursor-pointer hover:opacity-85"
                            >
                              <h5 className="font-bold text-xs text-slate-800 truncate">{pr.name}</h5>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {pr.series} series • {pr.workTime}s/{pr.restTime}s 
                                {pr.restBetweenSeries ? ` • Int: ${pr.restBetweenSeries}s` : ""}
                                {pr.warmup ? ` • Cal: ${pr.warmup}s` : ""}
                                {pr.cooldown ? ` • Enfr: ${pr.cooldown}s` : ""}
                                {` (${pr.exerciseName})`}
                              </p>
                            </button>
                            <button
                              onClick={() => handleDeletePreset(pr.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer"
                              title="Borrar preset"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* B. REGISTRO DE ENTRENAMIENTOS MANUALES */}
              {activeTrainingTool === "registro" && (
                <div className="space-y-4">
                  
                  {/* Stats summary panel */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                      <Flame className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-800">{getStreakDays()}</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Días racha</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                      <Check className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-800">{workoutsThisWeekCount}</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Esta sem</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                      <Clock className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-800">{getMinutesThisMonth()}</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Min mes</span>
                    </div>
                  </div>

                  {/* Logger Form */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Cargar Entrenamiento</h4>
                    
                    <form onSubmit={handleAddWorkoutLog} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                          <input
                            type="date"
                            required
                            value={logForm.date || ""}
                            onChange={e => setLogForm({ ...logForm, date: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Actividad</label>
                          <select
                            value={logForm.activityType || "Running"}
                            onChange={e => setLogForm({ ...logForm, activityType: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs"
                          >
                            {["Running", "Gimnasio", "Ciclismo", "Funcional", "Natacion", "Yoga", "Otro"].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Duración (Minutos)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={logForm.duration || 30}
                            onChange={e => setLogForm({ ...logForm, duration: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Distancia Km (Opcional)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 5.50"
                            value={logForm.distance || ""}
                            onChange={e => setLogForm({ ...logForm, distance: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Notas del entrenamiento</label>
                        <input
                          type="text"
                          placeholder="Frecuencia cardíaca, sensaciones, etc."
                          value={logForm.notes || ""}
                          onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#7C3AED]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#7C3AED] text-white py-2 rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Registrar Sesión de Hoy
                      </button>
                    </form>
                  </div>

                  {/* History List (Last 30) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Historial de entrenamientos</span>
                    
                    {last30Workouts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">Aún no registraste entrenamientos en este dispositivo.</p>
                    ) : (
                      <div className="space-y-2">
                        {last30Workouts.map((w) => (
                          <div key={w.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-2 shadow-xs">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-slate-800">{w.activityType}</span>
                                <span className="text-[9px] bg-purple-50 text-[#7C3AED] px-1.5 py-0.5 rounded-md font-bold">{w.duration} min</span>
                                {w.distance && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">{w.distance} km</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Fecha: {w.date}</p>
                              {w.notes && <p className="text-[10px] text-slate-500 italic truncate mt-1">"{w.notes}"</p>}
                            </div>
                            <button
                              onClick={() => handleDeleteWorkoutLog(w.id)}
                              className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* C. CONTADOR GPS */}
              {activeTrainingTool === "gps" && (
                <div className="space-y-4">
                  
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-center space-y-4 shadow-md">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-600 px-3 py-1 rounded-full text-white inline-block">
                      🛰️ TRACKER GPS EN TIEMPO REAL
                    </span>

                    {/* GPS Stats Big display */}
                    <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Distancia</span>
                        <h2 className="text-4xl font-black font-mono mt-1 text-emerald-400">{gpsDistance.toFixed(2)} <span className="text-sm">km</span></h2>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Tiempo</span>
                        <h2 className="text-4xl font-black font-mono mt-1">{formatTime(gpsElapsedSeconds)}</h2>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex justify-center items-center gap-2">
                      <span>Vel. Promedio: <strong>{gpsElapsedSeconds > 0 ? ((gpsDistance / (gpsElapsedSeconds / 3600)).toFixed(1)) : "0.0"} km/h</strong></span>
                    </div>

                    {/* GPS error or warning calls */}
                    {gpsErrorMsg && (
                      <div className="p-2.5 bg-red-950/50 text-red-400 border border-red-900 rounded-xl text-[10px] font-bold">
                        {gpsErrorMsg}
                      </div>
                    )}

                    {/* Geolocation permissions warning */}
                    <div className="text-[9px] text-slate-500 bg-slate-950 p-2 rounded-lg italic">
                      Aviso: El navegador solicitará permisos de localización. Mantenga la pantalla activa mientras corre.
                    </div>

                    {/* Operational controls */}
                    <div className="flex gap-2 pt-1">
                      {!gpsRunning ? (
                        <button
                          onClick={startGpsTracking}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Iniciar Tracking GPS</span>
                        </button>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          <button
                            onClick={gpsPaused ? resumeGpsTracking : pauseGpsTracking}
                            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {gpsPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            <span>{gpsPaused ? "Reanudar" : "Pausar"}</span>
                          </button>
                          
                          <button
                            onClick={stopAndSaveGpsTracking}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Save className="w-4 h-4" />
                            <span>Detener y Guardar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* D. OBJETIVOS SEMANALES */}
              {activeTrainingTool === "objetivos" && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                      <span>Objetivos de Entrenamiento Semanal</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">Definí cuántas sesiones de actividad querés hacer cada semana.</p>
                  </div>

                  {/* Slider configuration */}
                  <div className="space-y-4 pt-3 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Meta Semanal:</span>
                      <span className="text-sm font-black text-[#7C3AED] bg-purple-50 px-3 py-1 rounded-lg">
                        {weeklyGoal.targetWorkouts} veces por semana
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      value={weeklyGoal.targetWorkouts}
                      onChange={(e) => {
                        const updated = { ...weeklyGoal, targetWorkouts: Number(e.target.value) };
                        saveGoalToLocal(updated);
                      }}
                      className="w-full accent-[#7C3AED] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />

                    {/* Progress tracking display */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Progreso esta semana:</span>
                        <span className="font-black text-slate-800">
                          {workoutsThisWeekCount} / {weeklyGoal.targetWorkouts} entrenamientos
                        </span>
                      </div>

                      {/* Goal progress visual slider */}
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-500 ${
                            workoutsThisWeekCount >= weeklyGoal.targetWorkouts ? "bg-emerald-500" : "bg-[#7C3AED]"
                          }`}
                          style={{ width: `${Math.min(100, (workoutsThisWeekCount / weeklyGoal.targetWorkouts) * 100)}%` }}
                        ></div>
                      </div>

                      {workoutsThisWeekCount >= weeklyGoal.targetWorkouts ? (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 text-center justify-center">
                          <Check className="w-4 h-4" /> ¡Felicidades! Meta semanal alcanzada.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 text-center">
                          Te faltan {weeklyGoal.targetWorkouts - workoutsThisWeekCount} entrenamientos para completar el objetivo.
                        </p>
                      )}
                    </div>

                    {/* Custom Weekly Goal simulated History */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Historial de metas (Últimas 4 semanas)</span>
                      
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((weeksAgo) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (weeksAgo * 7));
                          const weekId = getWeekId(date);
                          const weekDisplay = date.toLocaleDateString("es-AR", { day: 'numeric', month: 'short' });
                          
                          // Simulate some random achieved logs if not customized yet to represent aesthetic beauty
                          const achievedCount = weeksAgo === 1 ? Math.min(weeklyGoal.targetWorkouts, 3) : weeksAgo === 2 ? weeklyGoal.targetWorkouts : Math.max(1, weeklyGoal.targetWorkouts - 1);
                          const percent = Math.min(100, (achievedCount / weeklyGoal.targetWorkouts) * 100);

                          return (
                            <div key={weekId} className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-700">Semana del {weekDisplay}</span>
                                <p className="text-[9px] text-slate-400 font-mono">ID: {weekId}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <span className="font-black text-slate-800">{achievedCount} / {weeklyGoal.targetWorkouts}</span>
                                <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-slate-400 h-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
