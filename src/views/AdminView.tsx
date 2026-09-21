import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import {
  Camera,
  Check,
  CircleDollarSign,
  Gift,
  Megaphone,
  Minus,
  Package,
  PiggyBank,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Ticket,
  Trash2,
  Upload,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  cashbackFor,
  claimableCards,
  fmtUSD,
  productById,
  shortDate,
  tierForLevel,
  timeAgo,
  type ResStatus,
  type User,
} from "../lib/data";
import {
  Avatar,
  confettiBurst,
  Modal,
  PandaHeadGlyph,
  ProductImg,
  readAndCompressImage,
  SectionHead,
  StarGlyph,
  StatusPill,
  useToast,
} from "../components/ui";
import PromoCarousel from "../components/PromoCarousel";

export default function AdminView({ tab }: { tab: string }) {
  if (tab === "jugadores") return <PlayersTab />;
  if (tab === "tienda") return <StoreTab />;
  if (tab === "banners") return <BannersTab />;
  if (tab === "resumen") return <SummaryTab />;
  return <ScanTab />;
}

/* ============================ Escáner ============================ */

type ScanResult =
  | { kind: "ok"; user: User; unlocked: boolean }
  | { kind: "dup"; user: User }
  | { kind: "notfound"; code: string };

function ScanTab() {
  const { state, registerVisitByCode, userName } = useStore();
  const { push } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);

  const start = async () => {
    setCamError(null);
    setResult(null);
    try {
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (res) => {
          if (res) handleCode(res.getText());
        }
      );
      controlsRef.current = controls;
      setScanning(true);
    } catch {
      setCamError(
        "No pudimos abrir la cámara. Revisa los permisos del navegador o usa el ingreso manual de abajo."
      );
    }
  };

  const handleCode = (raw: string) => {
    stop();
    const r = registerVisitByCode(raw);
    if (!r.ok) {
      setResult(r.reason === "dup" ? { kind: "dup", user: r.user } : { kind: "notfound", code: raw });
      return;
    }
    setResult({ kind: "ok", user: r.user, unlocked: r.unlocked });
    if (r.unlocked) {
      confettiBurst();
      push(`¡${r.user.name} completó su tarjeta! Premio disponible`, "info");
    }
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    if (manual.trim()) {
      handleCode(manual);
      setManual("");
    }
  };

  const today = new Date().toDateString();
  const todayVisits = state.visitLog.filter((v) => new Date(v.at).toDateString() === today);

  return (
    <div className="space-y-6">
      <SectionHead
        label="Caja · registro rápido"
        title="Escanear visita"
        right={
          <span className="chip border-mint-500/60 bg-mint-500/10 text-mint-300">
            <ScanLine className="h-3 w-3" /> {todayVisits.length} hoy
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Cámara */}
        <div className="card-tcg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.24em] text-ink-300 uppercase">Cámara de caja</span>
            {scanning && (
              <span className="chip border-coral-500/60 bg-coral-500/10 text-coral-300">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-coral-400" /> En vivo
              </span>
            )}
          </div>

          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg border-2 border-ink-700 bg-[#070f0a]">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

            {/* esquinas de enfoque */}
            {scanning && (
              <>
                <span className="absolute top-3 left-3 h-7 w-7 rounded-tl-md border-t-3 border-l-3 border-gold-400" />
                <span className="absolute top-3 right-3 h-7 w-7 rounded-tr-md border-t-3 border-r-3 border-gold-400" />
                <span className="absolute bottom-3 left-3 h-7 w-7 rounded-bl-md border-b-3 border-l-3 border-gold-400" />
                <span className="absolute right-3 bottom-3 h-7 w-7 rounded-br-md border-r-3 border-b-3 border-gold-400" />
                <span className="absolute inset-x-10 top-1/2 h-0.5 animate-pulse rounded bg-gold-400/70" />
              </>
            )}

            {!scanning && (
              <div className="bg-halftone absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070f0a]/92 p-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gold-500/60 bg-gold-500/10">
                  <Camera className="h-7 w-7 text-gold-400" />
                </span>
                <p className="max-w-[240px] text-sm text-[#a0c9ac]">
                  El jugador muestra su pase QR y lo escaneas aquí. Sello al instante.
                </p>
                <button onClick={start} className="btn-gold">
                  <Video className="h-4 w-4" /> Encender cámara
                </button>
                {camError && (
                  <p className="max-w-[260px] text-xs font-semibold text-[#ffa196]">{camError}</p>
                )}
              </div>
            )}
          </div>

          {scanning && (
            <button onClick={stop} className="btn-ghost mt-4 w-full">
              <VideoOff className="h-4 w-4" /> Detener cámara
            </button>
          )}

          {/* Ingreso manual */}
          <form onSubmit={submitManual} className="mt-4">
            <label className="label-fh">Ingreso manual · código del pase</label>
            <div className="flex gap-2">
              <input
                className="input-fh font-mono tracking-widest uppercase"
                placeholder="FH-XXXX"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <button type="submit" className="btn-gold shrink-0">
                Registrar
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              Útil si la cámara no está disponible: el código aparece bajo el QR del jugador.
            </p>
          </form>
        </div>

        {/* Resultado + actividad */}
        <div className="space-y-5">
          {result ? (
            <motion.div
              key={JSON.stringify(result)}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`card-tcg p-5 ${result.kind === "ok" ? "border-mint-500/60" : result.kind === "dup" ? "border-gold-500/60" : "border-coral-500/60"}`}
            >
              {result.kind === "ok" && (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar user={result.user} size={52} />
                    <div>
                      <div className="font-display text-lg leading-tight font-extrabold text-cream-100">
                        {result.user.name}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-mint-300">
                        Visita #{result.user.visits} registrada
                      </div>
                    </div>
                    <span className="ml-auto animate-stamp rounded-lg border-2 border-gold-500 bg-gradient-to-br from-gold-300 to-gold-500 p-2">
                      <PandaHeadGlyph className="h-8 w-8" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled =
                        result.user.visits % 10 === 0 ? 10 : result.user.visits % 10;
                      return (
                        <StarGlyph
                          key={i}
                          className={`h-4 w-4 ${i < filled ? "text-gold-400" : "text-ink-600"}`}
                        />
                      );
                    })}
                    <span className="ml-2 text-xs font-bold text-ink-300">
                      {result.user.visits % 10 === 0 ? "10/10" : `${result.user.visits % 10}/10`}
                    </span>
                  </div>
                  {result.unlocked && (
                    <div className="mt-4 rounded-lg border-2 border-gold-500 bg-gold-400/10 p-3.5 text-center">
                      <div className="font-display text-sm font-extrabold tracking-wide text-gold-300 uppercase">
                        ¡Tarjeta completada!
                      </div>
                      <p className="mt-1 text-xs text-ink-300">
                        Premio del nivel {result.user.visits / 10}:{" "}
                        <b className="text-cream-100">{tierForLevel(result.user.visits / 10).title}</b>. El jugador lo
                        canjea desde su app.
                      </p>
                    </div>
                  )}
                </>
              )}
              {result.kind === "dup" && (
                <div className="flex items-center gap-4">
                  <Avatar user={result.user} size={48} />
                  <div>
                    <div className="font-display font-extrabold text-cream-100">{result.user.name}</div>
                    <p className="mt-1 text-sm text-gold-300">
                      Ya registró una visita hace un momento. Evitamos sellos duplicados.
                    </p>
                  </div>
                </div>
              )}
              {result.kind === "notfound" && (
                <div>
                  <div className="font-display font-extrabold text-coral-300">Código no reconocido</div>
                  <p className="mt-1 text-sm text-ink-300">
                    No encontramos el pase <span className="font-mono font-bold text-cream-100">{result.code}</span>.
                    Verifica que el jugador tenga su cuenta creada o ingresa el código manualmente.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setResult(null);
                  start();
                }}
                className="btn-ghost mt-4 w-full"
              >
                <ScanLine className="h-4 w-4" /> Escanear siguiente
              </button>
            </motion.div>
          ) : (
            <div className="card-flat p-5">
              <div className="text-[10px] font-bold tracking-[0.24em] text-ink-400 uppercase">Así funciona</div>
              <ol className="mt-3 space-y-3">
                {[
                  "El jugador abre su app y muestra su pase QR.",
                  "Lo escaneas con la cámara de caja (o digitas su código).",
                  "Suma un sello al instante; a los 10 sellos se desbloquea un premio.",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-300">
                    <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-gold-500/60 bg-gold-500/10 text-xs font-extrabold text-gold-300">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Visitas de hoy */}
          <div className="card-flat p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.24em] text-ink-400 uppercase">Hoy en la tienda</span>
              <span className="chip border-ink-600 bg-ink-850 text-ink-300">{todayVisits.length} visitas</span>
            </div>
            {todayVisits.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">Aún no hay visitas registradas hoy.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {todayVisits.slice(0, 7).map((v) => {
                  const u = state.users.find((x) => x.id === v.userId);
                  return (
                    <li key={v.id} className="flex items-center gap-3 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2">
                      {u && <Avatar user={u} size={28} />}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-cream-100">
                        {userName(v.userId)}
                      </span>
                      <span className="font-mono text-xs text-ink-400">
                        {new Date(v.at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <LoyaltyTiersPanel />
    </div>
  );
}

function LoyaltyTiersPanel() {
  const { state, updateLoyaltyTierPrize } = useStore();
  const { push } = useToast();
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(state.loyaltyTiers.map((t) => [t.stars, t.prize]))
  );

  const save = () => {
    state.loyaltyTiers.forEach((t) => {
      const val = drafts[t.stars]?.trim();
      if (val) updateLoyaltyTierPrize(t.stars, val);
    });
    push("¡Premios de fidelidad actualizados!");
  };

  return (
    <div className="card-tcg p-5">
      <div className="text-[10px] font-bold tracking-[0.24em] text-gold-400 uppercase">Fidelidad</div>
      <h3 className="font-display mt-1 text-lg font-bold text-cream-100">Premios por estrellas doradas</h3>
      <p className="mt-1.5 text-xs text-ink-300">
        Los jugadores ganan estrellas automáticamente según sus visitas acumuladas. Solo define el premio de cada
        nivel.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[...state.loyaltyTiers]
          .sort((a, b) => a.stars - b.stars)
          .map((t) => (
            <div key={t.stars} className="card-flat p-4">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i <= t.stars ? "fill-gold-400 text-gold-400" : "text-ink-600"}`}
                  />
                ))}
              </div>
              <div className="mt-2 text-center text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                Desde {t.visitsRequired} visitas
              </div>
              <input
                className="input-fh mt-3 text-center text-sm"
                value={drafts[t.stars] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [t.stars]: e.target.value }))}
                placeholder="Nombre del premio"
              />
            </div>
          ))}
      </div>

      <button onClick={save} className="btn-gold mt-5 w-full py-2.5">
        Guardar premios de fidelidad
      </button>
    </div>
  );
}

/* ============================ Jugadores ============================ */

function PlayersTab() {
  const { state, adjustVisits, deliverReward, addCashbackFromPurchase } = useStore();
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [cashbackTarget, setCashbackTarget] = useState<User | null>(null);
  const [amount, setAmount] = useState("");

  const confirmCashback = () => {
    if (!cashbackTarget) return;
    const purchase = Number(amount);
    if (!purchase || purchase <= 0) {
      push("Ingresa un monto de compra válido.", "err");
      return;
    }
    const earned = addCashbackFromPurchase(cashbackTarget.id, purchase);
    push(`+${fmtUSD(earned)} de cashback para ${cashbackTarget.name} (compra de ${fmtUSD(purchase)})`);
    setCashbackTarget(null);
    setAmount("");
  };

  const players = useMemo(() => {
    const list = state.users.filter((u) => u.role === "player");
    const filtered = q.trim()
      ? list.filter(
          (u) =>
            u.name.toLowerCase().includes(q.toLowerCase()) ||
            u.email.toLowerCase().includes(q.toLowerCase()) ||
            u.code.toLowerCase().includes(q.toLowerCase())
        )
      : list;
    return [...filtered].sort((a, b) => b.visits - a.visits);
  }, [state.users, q]);

  return (
    <div className="space-y-5">
      <SectionHead
        label="Comunidad"
        title="Jugadores registrados"
        right={
          <span className="chip border-ink-600 bg-ink-850 text-ink-300">
            <Users className="h-3 w-3" /> {players.length}
          </span>
        }
      />

      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          className="input-fh pl-10"
          placeholder="Buscar por nombre, correo o código…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {players.map((u, i) => {
          const pendingReward = u.rewards.find((r) => !r.deliveredAt);
          const canClaim = claimableCards(u) > 0;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="card-flat flex flex-col gap-4 p-4 md:flex-row md:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <Avatar user={u} size={44} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display truncate text-sm font-bold text-cream-100">{u.name}</span>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-gold-300">{u.code}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-400">
                    {u.email} · {u.lastVisitAt ? `última visita ${timeAgo(u.lastVisitAt)}` : "sin visitas aún"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => adjustVisits(u.id, -1)}
                  className="cursor-pointer rounded-md border-2 border-ink-600 bg-ink-800 p-1.5 text-ink-300 transition hover:border-coral-400 hover:text-coral-300 active:translate-y-px"
                  aria-label="Quitar visita"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <div className="w-24 text-center">
                  <div className="font-display text-xl leading-none font-extrabold text-cream-100">{u.visits}</div>
                  <div className="mt-0.5 text-[9px] font-bold tracking-[0.14em] text-ink-400 uppercase">
                    Nv {u.cardsCompleted + 1} · {u.visits % 10}/10
                  </div>
                </div>
                <button
                  onClick={() => adjustVisits(u.id, 1)}
                  className="cursor-pointer rounded-md border-2 border-ink-600 bg-ink-800 p-1.5 text-ink-300 transition hover:border-mint-400 hover:text-mint-300 active:translate-y-px"
                  aria-label="Sumar visita"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>

              <button
                onClick={() => {
                  setCashbackTarget(u);
                  setAmount("");
                }}
                title="Registrar compra y sumar cashback"
                className="chip shrink-0 cursor-pointer border-mint-500/50 bg-mint-500/10 text-mint-300 transition hover:border-mint-400 hover:bg-mint-500/15"
              >
                <PiggyBank className="h-3 w-3" /> {fmtUSD(u.cashbackBalance)}
              </button>

              <div className="flex shrink-0 items-center gap-2 md:w-56 md:justify-end">
                {pendingReward ? (
                  <>
                    <span className="chip border-gold-500/60 bg-gold-500/10 text-gold-300">
                      <Gift className="h-3 w-3" /> {pendingReward.code}
                    </span>
                    <button
                      onClick={() => {
                        deliverReward(u.id, pendingReward.id);
                        push(`Premio "${pendingReward.title}" entregado a ${u.name}`);
                      }}
                      className="btn-mint px-3 py-1.5 text-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Entregar
                    </button>
                  </>
                ) : canClaim ? (
                  <span className="chip border-gold-500/60 bg-gold-500/10 text-gold-300">
                    <Star className="h-3 w-3" /> Premio por canjear
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-500">—</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal open={!!cashbackTarget} onClose={() => setCashbackTarget(null)}>
        {cashbackTarget && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.24em] text-mint-400 uppercase">Registrar compra</div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar user={cashbackTarget} size={44} />
              <div>
                <h3 className="font-display text-lg leading-tight font-bold text-cream-100">
                  {cashbackTarget.name}
                </h3>
                <p className="mt-0.5 text-xs text-ink-400">
                  Cashback actual: <b className="text-mint-300">{fmtUSD(cashbackTarget.cashbackBalance)}</b>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="label-fh">Monto de la compra (USD)</label>
              <input
                autoFocus
                className="input-fh"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-mint-500/40 bg-mint-500/10 px-4 py-3">
              <span className="text-sm font-semibold text-ink-300">Cashback automático (5%)</span>
              <span className="font-display text-xl font-extrabold text-mint-300">
                {fmtUSD(cashbackFor(Number(amount) || 0))}
              </span>
            </div>

            <button onClick={confirmCashback} className="btn-mint mt-4 w-full py-3 text-base">
              <Check className="h-4 w-4" strokeWidth={3} />
              Registrar compra y cashback
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================ Reservas ============================ */

const FILTERS: Array<{ key: ResStatus | "todas"; label: string }> = [
  { key: "todas", label: "Todas" },
  { key: "pendiente_pago", label: "Pago pendiente" },
  { key: "pago_por_verificar", label: "Por verificar" },
  { key: "pago_confirmado", label: "Confirmadas" },
  { key: "listo_retiro", label: "Listas" },
  { key: "entregado", label: "Entregadas" },
];

function ReservationsTab() {
  const { state, setReservationStatus, userName } = useStore();
  const { push } = useToast();
  const [filter, setFilter] = useState<ResStatus | "todas">("todas");

  const list = useMemo(() => {
    const all = [...state.reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filter === "todas" ? all : all.filter((r) => r.status === filter);
  }, [state.reservations, filter]);

  const countOf = (k: ResStatus | "todas") =>
    k === "todas" ? state.reservations.length : state.reservations.filter((r) => r.status === k).length;

  return (
    <div className="space-y-5">
      <SectionHead
        label="Seguimiento"
        title="Reservas de producto"
        right={
          <span className="chip border-ink-600 bg-ink-850 text-ink-300">
            <Ticket className="h-3 w-3" /> {state.reservations.length} totales
          </span>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip cursor-pointer transition ${
              filter === f.key
                ? "border-gold-500 bg-gold-400 text-ink-950"
                : "border-ink-600 bg-ink-850 text-ink-300 hover:border-ink-500"
            }`}
          >
            {f.label} · {countOf(f.key)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card-flat flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Package className="h-8 w-8 text-ink-500" />
          <p className="text-sm font-semibold text-ink-300">No hay reservas en este estado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((r, i) => {
            const p = productById(state.products, r.productId);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="card-flat flex flex-col gap-3 p-4 md:flex-row md:items-center"
              >
                {p && (
                  <ProductImg
                    src={p.img}
                    fallback={p.fallback}
                    alt={p.name}
                    className="h-16 w-16 shrink-0 rounded-lg border-2 border-ink-700 bg-ink-900 object-contain p-0.5"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-widest text-gold-300">{r.code}</span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="mt-1 truncate text-sm font-bold text-cream-100">
                    {p?.name ?? "Producto"} <span className="text-ink-400">× {r.qty}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-400">
                    {userName(r.userId)} · {shortDate(r.createdAt)}
                    {r.paidAt ? ` · pago enviado ${timeAgo(r.paidAt)}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-display text-lg font-extrabold text-gold-300">{fmtUSD(r.total)}</span>
                  {r.status === "pago_por_verificar" && (
                    <button
                      onClick={() => {
                        setReservationStatus(r.id, "pago_confirmado");
                        push(`Pago de ${r.code} confirmado`);
                      }}
                      className="btn-mint px-3.5 py-2 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} /> Confirmar pago
                    </button>
                  )}
                  {r.status === "pago_confirmado" && (
                    <button
                      onClick={() => {
                        setReservationStatus(r.id, "listo_retiro");
                        push(`${r.code} lista para retiro — el jugador verá el aviso`);
                      }}
                      className="btn-gold px-3.5 py-2 text-xs"
                    >
                      <Package className="h-3.5 w-3.5" /> Llegó a tienda
                    </button>
                  )}
                  {r.status === "listo_retiro" && (
                    <button
                      onClick={() => {
                        setReservationStatus(r.id, "entregado");
                        push(`${r.code} entregada. ¡Otro jugador feliz!`);
                      }}
                      className="btn-ghost px-3.5 py-2 text-xs"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Entregada
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ Tienda (productos + reservas) ============================ */

function StoreTab() {
  return (
    <div className="space-y-10">
      <ProductManager />
      <ReservationsTab />
    </div>
  );
}

function ProductManager() {
  const { state, createProduct, deleteProduct } = useStore();
  const { push } = useToast();

  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setImage(await readAndCompressImage(file));
    } catch {
      push("No pudimos leer esa imagen. Prueba con otra foto.", "err");
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setName("");
    setBlurb("");
    setPrice("");
    setStock("");
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!name.trim()) return push("Ponle un nombre al producto.", "err");
    if (!image) return push("Sube una foto del producto.", "err");
    if (!priceNum || priceNum <= 0) return push("Ingresa un precio válido.", "err");
    if (!stockNum || stockNum <= 0) return push("Ingresa un stock válido.", "err");
    createProduct(name.trim(), blurb.trim(), priceNum, image, stockNum);
    resetForm();
    push("¡Producto agregado a la tienda!");
  };

  return (
    <div className="space-y-5">
      <SectionHead
        label="Catálogo"
        title="Productos de la tienda"
        right={
          <span className="chip border-ink-600 bg-ink-850 text-ink-300">
            <ShoppingBag className="h-3 w-3" /> {state.products.length}
          </span>
        }
      />

      <form onSubmit={submit} className="card-tcg space-y-4 p-5">
        <div className="text-[10px] font-bold tracking-[0.24em] text-gold-400 uppercase">Nuevo producto</div>

        <div>
          <label className="label-fh">Nombre</label>
          <input
            className="input-fh"
            placeholder="Ej. Sobre Prize Pack 9"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="label-fh">Descripción</label>
          <textarea
            className="input-fh min-h-[70px] resize-none"
            placeholder="Cuenta qué trae el producto…"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-fh">Precio (USD)</label>
            <input
              className="input-fh"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label-fh">Stock</label>
            <input
              className="input-fh"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label-fh">Foto</label>
          {image ? (
            <div className="relative overflow-hidden rounded-lg border-2 border-ink-600">
              <img src={image} alt="Vista previa" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Quitar foto"
                className="absolute top-2 right-2 cursor-pointer rounded-md border-2 border-ink-700 bg-ink-900/85 p-1.5 text-ink-200 transition hover:border-coral-500 hover:text-coral-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn-ghost w-full border-dashed py-6 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {busy ? "Procesando…" : "Subir foto"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        </div>

        <p className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-xs leading-relaxed text-ink-300">
          El pago sigue el mismo método para todos los productos: transferencia o QR a la cuenta configurada en la
          tienda — no necesitas configurarlo por producto.
        </p>

        <button type="submit" className="btn-gold w-full py-2.5">
          Publicar producto
        </button>
      </form>

      {state.products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.products.map((p) => (
            <div key={p.id} className="card-flat flex items-center gap-3 p-3">
              <ProductImg
                src={p.img}
                fallback={p.fallback}
                alt={p.name}
                className="h-14 w-14 shrink-0 rounded-lg border-2 border-ink-700 bg-ink-900 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-cream-100">{p.name}</div>
                <div className="text-xs text-ink-400">
                  {fmtUSD(p.price)} · stock {p.stock}
                </div>
              </div>
              <button
                onClick={() => deleteProduct(p.id)}
                aria-label="Eliminar producto"
                className="cursor-pointer text-ink-400 transition hover:text-coral-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ Banners ============================ */

function BannersTab() {
  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <SectionHead
          label="Marketing"
          title="Banners de la tienda"
          right={
            <span className="chip border-ink-600 bg-ink-850 text-ink-300">
              <Megaphone className="h-3 w-3" /> promos · reservas · publicidad
            </span>
          }
        />
        <PromoCarousel />
      </div>

      <SplashPromoManager />
    </div>
  );
}

/* ============================ Promo del mes (splash de bienvenida) ============================ */

function SplashPromoManager() {
  const { state, updateSplashPromo } = useStore();
  const { push } = useToast();
  const { splashPromo } = state;

  const [active, setActive] = useState(splashPromo.active);
  const [title, setTitle] = useState(splashPromo.title);
  const [subtitle, setSubtitle] = useState(splashPromo.subtitle);
  const [image, setImage] = useState<string | null>(splashPromo.image);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setImage(await readAndCompressImage(file, 1280, 0.85));
    } catch {
      push("No pudimos leer esa imagen. Prueba con otra foto.", "err");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (active && !image) {
      push("Sube una imagen para activar la promo de bienvenida.", "err");
      return;
    }
    updateSplashPromo(active, image, title.trim(), subtitle.trim());
    push("¡Promo de bienvenida actualizada! La verán los jugadores al abrir la app.");
  };

  return (
    <div className="space-y-5">
      <SectionHead
        label="Bienvenida"
        title="Promo del mes / temporada"
        right={
          <span className={`chip ${active ? "border-mint-500/60 bg-mint-500/10 text-mint-300" : "border-ink-600 bg-ink-850 text-ink-300"}`}>
            {active ? "Activa" : "Inactiva"}
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-tcg space-y-4 p-5">
          <p className="text-xs leading-relaxed text-ink-300">
            Esta imagen aparece como bienvenida la primera vez que un jugador abre la app después de que la
            actualices — como el anuncio de promo del mes que se ve al entrar a una tienda online.
          </p>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-ink-600 bg-ink-900 px-3.5 py-2.5">
            <span className="text-sm font-bold text-cream-100">Mostrar al abrir la app</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 accent-gold-400"
            />
          </label>

          <div>
            <label className="label-fh">Título</label>
            <input
              className="input-fh"
              placeholder="Ej. ¡Promo de septiembre!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label-fh">Descripción breve</label>
            <textarea
              className="input-fh min-h-[70px] resize-none"
              placeholder="Ej. 20% OFF en figuras, funkos y TCG seleccionado"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label-fh">Imagen de la promo</label>
            {image ? (
              <div className="relative overflow-hidden rounded-lg border-2 border-ink-600">
                <img src={image} alt="Vista previa" className="h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  aria-label="Quitar imagen"
                  className="absolute top-2 right-2 cursor-pointer rounded-md border-2 border-ink-700 bg-ink-900/85 p-1.5 text-ink-200 transition hover:border-coral-500 hover:text-coral-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="btn-ghost w-full border-dashed py-6 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" /> {busy ? "Procesando…" : "Subir imagen"}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </div>

          <button onClick={save} className="btn-gold w-full py-2.5">
            Guardar promo de bienvenida
          </button>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold tracking-[0.24em] text-ink-400 uppercase">
            Vista previa · así la ven los jugadores
          </div>
          <div className="card-tcg holo-sheen mx-auto max-w-[280px] overflow-hidden p-0">
            {image ? (
              <img src={image} alt="Vista previa" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-ink-900 text-ink-500">
                Sin imagen
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display text-base font-extrabold text-cream-100">{title || "Título de la promo"}</h3>
              {subtitle && <p className="mt-1 text-xs text-ink-300">{subtitle}</p>}
              <div className="btn-gold mt-3 w-full py-2 text-xs">Ver en la tienda</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Resumen ============================ */

const STORE_SALE_STATUSES: ResStatus[] = ["pago_confirmado", "listo_retiro", "entregado"];

function SummaryTab() {
  const { state, userName } = useStore();

  const players = state.users.filter((u) => u.role === "player");
  const totalVisits = players.reduce((a, u) => a + u.visits, 0);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const visits7d = state.visitLog.filter((v) => new Date(v.at).getTime() >= weekAgo).length;
  const active = state.reservations.filter((r) => r.status !== "entregado" && r.status !== "cancelado");
  const toVerify = state.reservations
    .filter((r) => r.status === "pago_por_verificar")
    .reduce((a, r) => a + r.total, 0);

  const confirmedSales = state.reservations.filter((r) => STORE_SALE_STATUSES.includes(r.status));
  const totalSales = confirmedSales.reduce((a, r) => a + r.total, 0);
  const unitsSold = confirmedSales.reduce((a, r) => a + r.qty, 0);
  const avgTicket = confirmedSales.length ? totalSales / confirmedSales.length : 0;
  const recentStoreOrders = [...state.reservations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString("es-EC", { weekday: "short" }).replace(".", ""),
      count: state.visitLog.filter((v) => new Date(v.at).toDateString() === key).length,
      isToday: i === 6,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="space-y-6">
      <SectionHead label="Panel de la tienda" title="Resumen Panda Mangas Ecuador" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={<Users className="h-4 w-4 text-gold-400" />} label="Jugadores" value={String(players.length)} />
        <Tile icon={<Star className="h-4 w-4 text-mint-400" />} label="Visitas totales" value={String(totalVisits)} />
        <Tile icon={<ScanLine className="h-4 w-4 text-coral-400" />} label="Visitas 7 días" value={String(visits7d)} />
        <Tile icon={<Ticket className="h-4 w-4 text-pb-300" />} label="Reservas activas" value={String(active.length)} />
      </div>

      <div className="card-flat flex items-center justify-between gap-4 border-mint-500/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-mint-500/50 bg-mint-500/10">
            <CircleDollarSign className="h-5 w-5 text-mint-400" />
          </span>
          <div>
            <div className="text-sm font-bold text-cream-100">Pagos esperando verificación</div>
            <div className="text-xs text-ink-400">Reservas marcadas como "Ya pagué" por los jugadores</div>
          </div>
        </div>
        <span className="font-display text-2xl font-extrabold text-mint-300">{fmtUSD(toVerify)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card-tcg p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.24em] text-ink-300 uppercase">
              Visitas · últimos 7 días
            </span>
            <span className="chip border-gold-500/60 bg-gold-500/10 text-gold-300">{visits7d} sellos</span>
          </div>
          <div className="mt-5 flex h-44 items-end gap-2.5">
            {days.map((d, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`font-display text-xs font-bold ${d.isToday ? "text-gold-300" : "text-ink-400"}`}>
                  {d.count}
                </span>
                <div
                  className={`animate-bar w-full rounded-t-md origin-bottom ${
                    d.isToday
                      ? "bg-gradient-to-t from-gold-600 to-gold-300"
                      : "bg-gradient-to-t from-ink-600 to-ink-500"
                  }`}
                  style={{
                    height: `${Math.max(6, (d.count / max) * 100)}%`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
                <span className={`text-[10px] font-bold uppercase ${d.isToday ? "text-gold-300" : "text-ink-500"}`}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-flat p-5 lg:col-span-2">
          <span className="text-[10px] font-bold tracking-[0.24em] text-ink-400 uppercase">Actividad reciente</span>
          <ul className="mt-3 space-y-2.5">
            {state.visitLog.slice(0, 8).map((v) => {
              const u = state.users.find((x) => x.id === v.userId);
              return (
                <li key={v.id} className="flex items-center gap-3 text-sm">
                  {u && <Avatar user={u} size={26} />}
                  <span className="min-w-0 flex-1 truncate text-ink-300">
                    <b className="text-cream-100">{u?.name ?? "Jugador"}</b> visitó la tienda
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-500">{timeAgo(v.at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div>
        <SectionHead label="Tienda" title="Ventas y reservas en tienda" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            icon={<CircleDollarSign className="h-4 w-4 text-mint-400" />}
            label="Ventas confirmadas"
            value={fmtUSD(totalSales)}
          />
          <Tile
            icon={<Ticket className="h-4 w-4 text-gold-400" />}
            label="Reservas totales"
            value={String(state.reservations.length)}
          />
          <Tile
            icon={<ShoppingBag className="h-4 w-4 text-pb-300" />}
            label="Unidades vendidas"
            value={String(unitsSold)}
          />
          <Tile
            icon={<Star className="h-4 w-4 text-coral-400" />}
            label="Ticket promedio"
            value={fmtUSD(avgTicket)}
          />
        </div>

        <div className="card-tcg mt-5 p-5">
          <span className="text-[10px] font-bold tracking-[0.24em] text-ink-300 uppercase">
            Últimas órdenes en tienda
          </span>
          {recentStoreOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">Todavía no hay reservas en la tienda.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentStoreOrders.map((r) => {
                const p = productById(state.products, r.productId);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-cream-100">
                      <b>{userName(r.userId)}</b> · {p?.name ?? "Producto"} × {r.qty}
                    </span>
                    <StatusPill status={r.status} />
                    <span className="font-display font-bold text-gold-300">{fmtUSD(r.total)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-flat p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink-600 bg-ink-850">
          {icon}
        </span>
        <span className="text-[10px] font-bold tracking-[0.16em] text-ink-400 uppercase">{label}</span>
      </div>
      <div className="font-display mt-3 text-3xl leading-none font-extrabold text-cream-100">{value}</div>
    </div>
  );
}
