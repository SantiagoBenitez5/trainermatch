import React, { useState } from "react";
import { getFirebaseAuth, getGoogleProvider } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { Mail, Lock, Sparkles, User, Dumbbell, ShieldAlert, ArrowRight } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: { uid: string; email: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"cliente" | "entrenador">("cliente");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Error de configuración de Firebase.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (credential.user) {
          // Check if there is already a saved role, otherwise default to cliente
          const existingRole = localStorage.getItem(`trainermatch_role_${credential.user.uid}`);
          if (!existingRole) {
            localStorage.setItem(`trainermatch_role_${credential.user.uid}`, "cliente");
          }
          onAuthSuccess({ uid: credential.user.uid, email: credential.user.email || "" });
        }
      } else {
        // Sign Up
        if (password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (credential.user) {
          // Save selected role
          localStorage.setItem(`trainermatch_role_${credential.user.uid}`, accountType);
          onAuthSuccess({ uid: credential.user.uid, email: credential.user.email || "" });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está registrado.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Credenciales incorrectas.");
      } else if (err.code === "auth/invalid-email") {
        setError("Correo electrónico inválido.");
      } else {
        setError(err.message || "Ocurrió un error en la autenticación.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Error de configuración de Firebase.");
      setLoading(false);
      return;
    }

    try {
      const provider = getGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // If Google user has no role, we will prompt or default to cliente
        const existingRole = localStorage.getItem(`trainermatch_role_${result.user.uid}`);
        if (!existingRole) {
          // Show choice or default to cliente. We will let the user change it or prompt them
          localStorage.setItem(`trainermatch_role_${result.user.uid}`, "cliente");
        }
        onAuthSuccess({ uid: result.user.uid, email: result.user.email || "" });
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto my-4 space-y-5">
      
      {/* Visual Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-purple-50 text-[#7C3AED] rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Dumbbell className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">
          {isLogin ? "Iniciar Sesión" : "Crear tu Cuenta"}
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          {isLogin 
            ? "Accedé a tu agenda de clases, entrenamientos y pagos en Gualeguaychú." 
            : "Elegí tu perfil y formate como cliente o entrenador verificado."
          }
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => { setIsLogin(true); setError(""); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            isLogin ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(""); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            !isLogin ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Registrarse
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-start gap-2 border border-red-100">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleAuth} className="space-y-4">
        
        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        {/* ACCOUNT TYPE SELECTION (Only visible on Registration) */}
        {!isLogin && (
          <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">¿Cómo querés usar TrainerMatch?</label>
            <div className="grid grid-cols-1 gap-2">
              
              {/* Option A: Client */}
              <button
                type="button"
                onClick={() => setAccountType("cliente")}
                className={`p-3 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all ${
                  accountType === "cliente"
                    ? "border-[#7C3AED] bg-purple-50/40 text-slate-800"
                    : "border-slate-100 hover:border-slate-200 text-slate-600"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  accountType === "cliente" ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs">Soy cliente — busco entrenador</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quiero buscar entrenadores, agendar clases y seguir mis rutinas.</p>
                </div>
              </button>

              {/* Option B: Trainer */}
              <button
                type="button"
                onClick={() => setAccountType("entrenador")}
                className={`p-3 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all ${
                  accountType === "entrenador"
                    ? "border-[#7C3AED] bg-purple-50/40 text-slate-800"
                    : "border-slate-100 hover:border-slate-200 text-slate-600"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  accountType === "entrenador" ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs">Soy entrenador — quiero publicar mi perfil</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quiero registrar mis datos, subir fotos de títulos y gestionar alumnos.</p>
                </div>
              </button>

            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
        >
          <span>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Google Login Separator */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase">O bien</span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-[#7C3AED] fill-[#7C3AED]" />
        <span>Ingresar con Google</span>
      </button>

    </div>
  );
};
