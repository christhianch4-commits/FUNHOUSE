import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { AlertTriangle, Check, Copy, Moon, Package, Sparkles, Sun, X } from "lucide-react";
import {
  claimableCards,
  tierForLevel,
  VISITS_PER_CARD,
  type ResStatus,
  type User,
} from "../lib/data";
import pandaHeadClean from "../assets/panda-mangas/panda-head-outlined.png";

/* ================= Imagen: lectura y compresión ================= */

/** Redimensiona y comprime una foto en el navegador antes de guardarla (evita saturar el almacenamiento local). */
export function readAndCompressImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ================= Confetti ================= */

export const confettiBurst = (colors?: string[]) => {
  confetti({
    particleCount: 150,
    spread: 78,
    origin: { y: 0.62 },
    colors: colors ?? ["#55D957", "#4FDCC0", "#FF7A6B", "#C4ADFF", "#F6EFDD"],
    disableForReducedMotion: true,
  });
};

/* ================= Toasts ================= */

type ToastKind = "ok" | "err" | "info";
interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}
interface ToastApi {
  push: (msg: string, kind?: ToastKind) => void;
}

const ToastCtx = createContext<ToastApi>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

let toastSeq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const styles: Record<ToastKind, string> = {
    ok: "border-mint-500 bg-ink-850 text-mint-300",
    err: "border-coral-500 bg-ink-850 text-coral-300",
    info: "border-gold-500 bg-ink-850 text-gold-300",
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className={`flex max-w-md items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold shadow-[5px_5px_0_0_var(--t-shadow)] ${styles[t.kind]}`}
            >
              {t.kind === "ok" && <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
              {t.kind === "err" && <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
              {t.kind === "info" && <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
              <span className="text-cream-100">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ================= Modal ================= */

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-[#070f0a]/85 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`card-tcg relative max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-b-xl sm:p-6 ${
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            }`}
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3.5 right-3.5 cursor-pointer rounded-lg border-2 border-ink-600 bg-ink-800 p-1.5 text-ink-300 transition hover:border-coral-500 hover:text-coral-400"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= Logo ================= */

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#102417" stroke="#2C5C39" strokeWidth="2.5" />
      <path
        d="M32 10 53 25.5V50a3.5 3.5 0 0 1-3.5 3.5h-35A3.5 3.5 0 0 1 11 50V25.5Z"
        fill="none"
        stroke="#55D957"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <path d="M35.5 21 23 38.5h7.2L26 52l14.5-18.5h-7.4Z" fill="#55D957" />
      <circle cx="47" cy="17" r="3" fill="#4FDCC0" />
    </svg>
  );
}

/** Cabeza del panda: silueta limpia recortada del logo original del cliente (sin hojas de bambú). */
export function PandaHeadGlyph({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src={pandaHeadClean}
      alt="Panda Mangas Ecuador"
      draggable={false}
      className={`${className} object-contain`}
    />
  );
}

export function BrandImg({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <PandaHeadGlyph
      className={`${className} shrink-0 drop-shadow-[2px_4px_0_var(--t-shadow)]`}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandImg className={compact ? "h-12 w-12" : "h-20 w-20"} />
      <div className="leading-none">
        <div className={`font-display font-extrabold text-cream-100 ${compact ? "text-base" : "text-xl"}`}>
          Panda<span className="text-gold-400">Mangas</span>
        </div>
        <div className="mt-0.5 text-[9px] font-bold tracking-[0.3em] text-ink-300 uppercase">
          Mangas · Ecuador
        </div>
      </div>
    </div>
  );
}

/* ================= Toggle día / noche ================= */

export function ThemeToggle() {
  const [light, setLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("light")
  );
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next ? "#eaf1ea" : "#070f0a");
    try {
      localStorage.setItem("fh-theme", next ? "light" : "dark");
    } catch {
      /* noop */
    }
  };
  return (
    <button
      onClick={toggle}
      aria-label={light ? "Cambiar a modo noche" : "Cambiar a modo día"}
      title={light ? "Modo noche" : "Modo día"}
      className="cursor-pointer rounded-lg border-2 border-ink-700 bg-ink-850 p-2 text-gold-300 transition hover:border-gold-400 active:translate-y-px"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={light ? "sun" : "moon"}
          initial={{ y: 12, opacity: 0, rotate: -50 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -12, opacity: 0, rotate: 50 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          {light ? <Sun className="h-4 w-4" strokeWidth={2.4} /> : <Moon className="h-4 w-4" strokeWidth={2.4} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* ================= Imagen de producto con respaldo ================= */

export function ProductImg({
  src,
  fallback,
  alt,
  className,
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [dead, setDead] = useState(false);
  if (dead) {
    return (
      <div className={`flex items-center justify-center bg-ink-900 ${className ?? ""}`}>
        <Package className="h-8 w-8 text-ink-500" />
      </div>
    );
  }
  return (
    <img
      src={failed ? fallback : src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => (failed ? setDead(true) : setFailed(true))}
    />
  );
}

/* ================= Glifos de palos (ambient / sellos) ================= */

export const BoltGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M13.5 2 5 13.5h5L9 22l10-13h-5.5Z" />
  </svg>
);
export const StarGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 1.8 15 8.6l7.2.6-5.4 4.8 1.6 7-6.4-3.7L5.6 21l1.6-7L1.8 9.2 9 8.6Z" />
  </svg>
);
export const OrbGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <circle cx="12" cy="12" r="9" opacity="0.9" />
    <circle cx="9" cy="9" r="2.6" fill="#0B161D" opacity="0.35" />
  </svg>
);
export const DiamondGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 1.5 22 12 12 22.5 2 12Z" />
  </svg>
);

/* ================= Avatar ================= */

export function Avatar({ user, size = 40 }: { user: Pick<User, "name" | "hue">; size?: number }) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="font-display flex shrink-0 items-center justify-center rounded-xl border-2 border-ink-950/60 font-bold text-ink-950"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(135deg, hsl(${user.hue} 75% 62%), hsl(${(user.hue + 45) % 360} 70% 42%))`,
      }}
    >
      {initials}
    </div>
  );
}

/* ================= Status pill ================= */

export const STATUS_META: Record<ResStatus, { label: string; cls: string }> = {
  pendiente_pago: { label: "Pago pendiente", cls: "border-coral-500/60 bg-coral-500/10 text-coral-300" },
  pago_por_verificar: { label: "Verificando pago", cls: "border-gold-500/60 bg-gold-500/10 text-gold-300" },
  pago_confirmado: { label: "Pago confirmado", cls: "border-mint-500/60 bg-mint-500/10 text-mint-300" },
  listo_retiro: { label: "¡Listo para retiro!", cls: "border-pb-400/60 bg-pb-400/10 text-pb-300" },
  entregado: { label: "Entregado", cls: "border-ink-500 bg-ink-800 text-ink-300" },
  cancelado: { label: "Cancelada", cls: "border-ink-600 bg-ink-900 text-ink-400" },
};

export function StatusPill({ status }: { status: ResStatus }) {
  const m = STATUS_META[status];
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}

/* ================= Sección ================= */

export function SectionHead({ label, title, right }: { label: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-bold tracking-[0.28em] text-gold-400 uppercase">{label}</div>
        <h2 className="font-display mt-1 text-lg font-bold text-cream-100 sm:text-xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ================= Tarjeta de sellos ================= */

export function StampCard({ user, onClaim }: { user: User; onClaim: () => void }) {
  const claimable = claimableCards(user) > 0;
  const filled = claimable ? VISITS_PER_CARD : user.visits % VISITS_PER_CARD;
  const currentLevel = user.cardsCompleted + 1;
  const tier = tierForLevel(currentLevel);

  return (
    <div className="card-tcg holo-sheen p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-[0.24em] text-ink-300 uppercase">
          Tarjeta de sellos
        </div>
        <span className="chip border-gold-500/60 bg-gold-500/10 text-gold-300">
          Nivel {currentLevel}
        </span>
      </div>

      <div key={user.visits} className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: VISITS_PER_CARD }).map((_, i) => {
          const on = i < filled;
          const isLast = i === VISITS_PER_CARD - 1;
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-lg border-2 transition-colors ${
                on
                  ? "border-gold-600 bg-gradient-to-br from-gold-300 to-gold-500"
                  : isLast && claimable
                    ? "border-gold-400 border-dashed bg-ink-800"
                    : "border-ink-600 border-dashed bg-ink-900"
              } ${on ? "animate-stamp" : ""} ${isLast && !on ? "animate-pulse-gold" : ""}`}
              style={on ? { animationDelay: `${i * 45}ms` } : undefined}
            >
              {on ? (
                <PandaHeadGlyph className="h-4/5 w-4/5 drop-shadow-sm" />
              ) : (
                <span className="font-display text-[10px] font-bold text-ink-500">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-300">
          <span className="font-display text-base font-extrabold text-cream-100">{filled}</span>
          <span className="text-ink-400">/{VISITS_PER_CARD} visitas</span>
        </span>
        <span className="text-right text-xs leading-tight text-ink-300">
          Premio de esta tarjeta:
          <br />
          <span className="font-bold text-gold-300">{tier.title}</span>
        </span>
      </div>

      {claimable ? (
        <motion.button
          onClick={onClaim}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="btn-gold animate-pulse-gold mt-4 w-full text-base"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          ¡Tarjeta completa! Canjear premio
        </motion.button>
      ) : (
        <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-xs text-ink-300">
          Te faltan <b className="text-cream-100">{VISITS_PER_CARD - filled}</b> visitas para ganar{" "}
          <b className="text-gold-300">{tier.title}</b>. Escanea tu pase en caja cada vez que vengas.
        </div>
      )}
    </div>
  );
}

/* ================= Copy button ================= */

export function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide uppercase transition ${
        copied
          ? "border-mint-500 bg-mint-500/15 text-mint-300"
          : "border-ink-600 bg-ink-800 text-ink-300 hover:border-gold-400 hover:text-gold-300"
      }`}
    >
      {copied ? <Check className="h-3 w-3" strokeWidth={3} /> : <Copy className="h-3 w-3" strokeWidth={2.5} />}
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
