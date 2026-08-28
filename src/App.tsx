import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  LogOut,
  Package,
  QrCode,
  ScanLine,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import {
  ToastProvider,
  Wordmark,
  Avatar,
  ThemeToggle,
  BoltGlyph,
  StarGlyph,
  OrbGlyph,
  DiamondGlyph,
} from "./components/ui";
import AuthView from "./views/AuthView";
import PlayerView from "./views/PlayerView";
import { STORE_INFO } from "./lib/data";

const AdminView = lazy(() => import("./views/AdminView"));

interface TabDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const PLAYER_TABS: TabDef[] = [
  { key: "pase", label: "Mi Pase", icon: <QrCode className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  { key: "tienda", label: "Preventas", icon: <Package className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  { key: "reservas", label: "Mis Reservas", icon: <Ticket className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
];

const ADMIN_TABS: TabDef[] = [
  { key: "scan", label: "Escanear", icon: <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  { key: "jugadores", label: "Jugadores", icon: <Users className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  { key: "reservas", label: "Reservas", icon: <Ticket className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
  { key: "resumen", label: "Resumen", icon: <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2.4} /> },
];

function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="bg-halftone absolute inset-0 opacity-70" />
      <div className="absolute -top-44 -left-44 h-[500px] w-[500px] rounded-full bg-gold-400/10 blur-3xl" />
      <div className="absolute -right-44 -bottom-52 h-[540px] w-[540px] rounded-full bg-mint-400/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-[380px] w-[380px] rounded-full bg-pb-400/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-coral-400 to-mint-400 opacity-90" />
      <StarGlyph className="animate-float absolute top-[14%] left-[5%] h-10 w-10 text-gold-400/10" />
      <BoltGlyph className="animate-float-slow absolute bottom-[16%] left-[10%] h-12 w-12 text-mint-400/10" />
      <DiamondGlyph className="animate-float absolute top-[24%] right-[7%] h-9 w-9 text-coral-400/10" />
      <OrbGlyph className="animate-float-slow absolute right-[12%] bottom-[22%] h-11 w-11 text-pb-400/10" />
    </div>
  );
}

function Shell() {
  const { currentUser, logout } = useStore();
  const [tab, setTab] = useState("pase");

  const isAdmin = currentUser?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : PLAYER_TABS;

  useEffect(() => {
    setTab(currentUser?.role === "admin" ? "scan" : "pase");
  }, [currentUser?.id, currentUser?.role]);

  if (!currentUser) return null;

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-ink-800 bg-ink-950/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Wordmark compact />

          <nav className="ml-auto hidden items-center gap-1.5 md:flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-xs font-bold transition ${
                  tab === t.key
                    ? "border-gold-600 bg-gold-400 text-ink-950 shadow-[3px_3px_0_0_var(--t-shadow)]"
                    : "border-ink-700 bg-ink-850/60 text-ink-300 hover:border-ink-500 hover:text-cream-100"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5 md:ml-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs leading-tight font-bold text-cream-100">{currentUser.name}</div>
              <div className={`text-[10px] font-bold tracking-[0.18em] uppercase ${isAdmin ? "text-coral-300" : "text-mint-300"}`}>
                {isAdmin ? "Admin tienda" : "Jugador"}
              </div>
            </div>
            <ThemeToggle />
            <Avatar user={currentUser} size={34} />
            <button
              onClick={logout}
              aria-label="Salir"
              title="Cerrar sesión"
              className="cursor-pointer rounded-lg border-2 border-ink-700 bg-ink-850 p-2 text-ink-300 transition hover:border-coral-500 hover:text-coral-300 active:translate-y-px"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {isAdmin ? (
              <Suspense
                fallback={
                  <div className="flex justify-center py-24">
                    <span className="font-display animate-blink text-sm font-bold tracking-[0.2em] text-gold-300 uppercase">
                      Abriendo la caja…
                    </span>
                  </div>
                }
              >
                <AdminView tab={tab} />
              </Suspense>
            ) : (
              <PlayerView tab={tab} setTab={setTab} />
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink-800 pt-6 text-xs text-ink-500">
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-gold-400" />
            HABEMUS JUEGOS · {STORE_INFO.locations}
          </span>
          <span>{STORE_INFO.catalog} · {STORE_INFO.events}</span>
        </footer>
      </main>

      {/* Nav móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink-800 bg-ink-900/95 backdrop-blur-md md:hidden">
        <div className={`mx-auto grid max-w-md ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[10px] font-bold tracking-wide uppercase transition ${
                tab === t.key ? "text-gold-300" : "text-ink-400"
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="navdot"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-gold-400"
                />
              )}
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Root() {
  const { currentUser } = useStore();
  return currentUser ? <Shell /> : <AuthView />;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Ambient />
        <Root />
      </ToastProvider>
    </StoreProvider>
  );
}
