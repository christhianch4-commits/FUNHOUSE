import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Eye, EyeOff, Gift, Instagram, Mail, MapPin, Package, ShieldCheck, Star, Zap } from "lucide-react";
import { useStore } from "../lib/store";
import { STORE_INFO } from "../lib/data";
import { useToast, Wordmark, ThemeToggle, BoltGlyph, StarGlyph } from "../components/ui";

export default function AuthView() {
  const { login, register } = useStore();
  const { push } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = mode === "login" ? login(email, pass) : register(name, email, pass);
    if (r) {
      setErr(r);
      setShake((s) => s + 1);
    } else {
      push(mode === "login" ? "¡Bienvenido de vuelta a Habemus Juegos!" : "¡Cuenta creada! Ya tienes tu pase QR");
    }
  };

  const fillDemo = (kind: "admin" | "player") => {
    setMode("login");
    setErr(null);
    if (kind === "admin") {
      setEmail("admin@funhouse.ec");
      setPass("admin1234");
    } else {
      setEmail("demo@jugador.ec");
      setPass("demo1234");
    }
  };

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Panel de marca */}
      <div className="bg-diag-gold relative hidden flex-col justify-between overflow-hidden border-r-2 border-ink-800 p-10 lg:flex">
        <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="relative">
            {/* cartas fantasma detrás */}
            <div className="absolute -top-8 -left-14 h-56 w-40 rotate-[-14deg] rounded-xl border-2 border-pb-400/40 bg-gradient-to-br from-pb-500/25 to-ink-850 shadow-[10px_10px_0_0_var(--t-shadow)]" />
            <div className="absolute -right-12 -bottom-6 h-52 w-36 rotate-[11deg] rounded-xl border-2 border-coral-500/40 bg-gradient-to-br from-coral-500/20 to-ink-850 shadow-[10px_10px_0_0_var(--t-shadow)]" />

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="card-tcg holo-sheen relative w-[330px] p-6"
              style={{ ["--tilt" as never]: "-2deg" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.3em] text-gold-400 uppercase">
                  Pase de jugador
                </span>
                <span className="chip border-mint-500/60 bg-mint-500/10 text-mint-300">Activo</span>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="rounded-xl bg-[#f6efdd] p-2.5">
                  <QRCodeSVG value="FH:u-demo" size={92} fgColor="#0B161D" bgColor="#F6EFDD" />
                </div>
                <div>
                  <div className="font-display text-lg leading-tight font-extrabold text-cream-100">
                    Daniela<br />Proaño
                  </div>
                  <div className="mt-1 font-mono text-xs font-bold text-gold-300">FH-7K3D</div>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <StarGlyph key={i} className={`h-3.5 w-3.5 ${i < 7 ? "text-gold-400" : "text-ink-600"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs">
                <span className="text-ink-300">Sellos</span>
                <span className="font-display font-bold text-cream-100">
                  7<span className="text-ink-400">/10</span>
                </span>
                <span className="text-ink-300">Nivel</span>
                <span className="font-display font-bold text-gold-300">1</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative space-y-3">
          <h1 className="font-display max-w-md text-3xl leading-[1.15] font-extrabold text-cream-100">
            Tu tienda de juegos en Ecuador, <span className="text-gold-400">ahora en tu bolsillo.</span>
          </h1>
          <ul className="space-y-2.5 pt-2 text-sm text-ink-300">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gold-500/50 bg-gold-500/10">
                <BoltGlyph className="h-4 w-4 text-gold-400" />
              </span>
              Escanea tu pase en caja y suma visitas al toque
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-mint-500/50 bg-mint-500/10">
                <Gift className="h-4 w-4 text-mint-400" />
              </span>
              Cada 10 visitas canjeas premios: sobres, promos, playmats…
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-pb-400/50 bg-pb-400/10">
                <Package className="h-4 w-4 text-pb-300" />
              </span>
              Encuentra juegos de mesa, rol, TCG, infantiles y accesorios
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-coral-400" /> {STORE_INFO.locations}
            </span>
            <a
              href={`mailto:${STORE_INFO.email}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition hover:text-gold-300"
            >
              <Mail className="h-3.5 w-3.5" /> {STORE_INFO.email}
            </a>
            <a href={STORE_INFO.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-gold-300">
              <Instagram className="h-3.5 w-3.5" /> @habemusjuegos
            </a>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-5 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="card-tcg w-full max-w-md p-6 sm:p-8"
        >
          <div className="mb-6 lg:hidden">
            <Wordmark />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-cream-100">
            {mode === "login" ? "Entrar a Habemus Juegos" : "Únete al club"}
          </h2>
          <p className="mt-1.5 text-sm text-ink-300">
            {mode === "login"
              ? "Escanea, suma sellos y reclama tus premios."
              : "Crea tu cuenta y recibe tu pase QR de jugador al instante."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border-2 border-ink-600 bg-ink-900 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErr(null);
                }}
                className={`cursor-pointer rounded-md py-2 text-sm font-bold transition ${
                  mode === m ? "bg-gold-400 text-ink-950 shadow-[2px_2px_0_0_var(--t-shadow)]" : "text-ink-300 hover:text-cream-100"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <motion.form
            key={shake}
            onSubmit={submit}
            animate={shake > 0 ? { x: [0, -9, 9, -6, 6, 0] } : undefined}
            transition={{ duration: 0.4 }}
            className="mt-5 space-y-4"
          >
            {mode === "signup" && (
              <div>
                <label className="label-fh">Nombre completo</label>
                <input
                  className="input-fh"
                  placeholder="Ej. Andrea Jácome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label-fh">Correo</label>
              <input
                className="input-fh"
                type="email"
                placeholder="tu@correo.ec"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-fh">Contraseña</label>
              <div className="relative">
                <input
                  className="input-fh pr-11"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-400 transition hover:text-gold-300"
                  aria-label="Mostrar contraseña"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="rounded-lg border-2 border-coral-500/60 bg-coral-500/10 px-3 py-2.5 text-sm font-semibold text-coral-300">
                {err}
              </div>
            )}

            <button type="submit" className="btn-gold w-full py-3 text-base">
              {mode === "login" ? "Entrar" : "Crear mi pase"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </motion.form>

          <div className="mt-6 rounded-lg border border-ink-700 bg-ink-900 p-3.5">
            <div className="mb-2.5 text-[10px] font-bold tracking-[0.22em] text-ink-400 uppercase">
              Cuentas demo · tócalas para llenar
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => fillDemo("player")}
                className="group flex cursor-pointer items-center gap-2.5 rounded-lg border-2 border-ink-600 bg-ink-850 px-3 py-2.5 text-left transition hover:border-gold-400"
              >
                <Star className="h-4 w-4 shrink-0 text-gold-400" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-cream-100">Jugador</span>
                  <span className="block truncate text-[11px] text-ink-400">demo@jugador.ec · demo1234</span>
                </span>
              </button>
              <button
                onClick={() => fillDemo("admin")}
                className="group flex cursor-pointer items-center gap-2.5 rounded-lg border-2 border-ink-600 bg-ink-850 px-3 py-2.5 text-left transition hover:border-coral-400"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-coral-400" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-cream-100">Admin tienda</span>
                  <span className="block truncate text-[11px] text-ink-400">admin@funhouse.ec · admin1234</span>
                </span>
              </button>
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ink-400">
            <Zap className="h-3.5 w-3.5 text-gold-400" />
            {STORE_INFO.catalog} · {STORE_INFO.freeShipping}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
