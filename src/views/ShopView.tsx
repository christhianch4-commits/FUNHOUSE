import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  Banknote,
  Check,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Store,
  Zap,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  fmtUSD,
  PAYMENT,
  payQrPayload,
  PB_BANNER,
  PB_BANNER_FALLBACK,
  productById,
  PRODUCTS,
  shortDate,
  timeAgo,
  type Product,
  type Reservation,
  type User,
} from "../lib/data";
import { confettiBurst, CopyBtn, Modal, ProductImg, SectionHead, StatusPill, useToast } from "../components/ui";

/* ============================ Banner ============================ */

function BannerImg() {
  const [stage, setStage] = useState(0);
  const sources = [PB_BANNER, PB_BANNER_FALLBACK];
  if (stage >= sources.length) {
    return <div className="h-56 w-full bg-gradient-to-br from-ink-700 via-ink-900 to-ink-950 sm:h-64" />;
  }
  return (
    <img
      src={sources[stage]}
      alt="Mega Evolution — Pitch Black"
      referrerPolicy="no-referrer"
      onError={() => setStage((s) => s + 1)}
      className="h-56 w-full object-cover sm:h-64"
    />
  );
}

/* ============================ Tienda / preventa ============================ */

export default function Shop({ user }: { user: User }) {
  const { createReservation, setReservationStatus } = useStore();
  const { push } = useToast();
  const [reserveFor, setReserveFor] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [payRes, setPayRes] = useState<Reservation | null>(null);

  const openReserve = (p: Product) => {
    setQty(1);
    setReserveFor(p);
  };

  const confirm = () => {
    if (!reserveFor) return;
    const r = createReservation(user.id, reserveFor.id, qty, qty * reserveFor.price);
    setReserveFor(null);
    setPayRes(r);
    push(`Reserva ${r.code} creada — estos son tus datos de pago`, "info");
  };

  const onPaid = () => {
    if (!payRes) return;
    setReservationStatus(payRes.id, "pago_por_verificar");
    confettiBurst();
    push("¡Gracias! Verificaremos tu pago y te avisaremos cuando llegue");
    setPayRes(null);
  };

  return (
    <div className="space-y-8">
      {/* Banner de preventa */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border-2 border-ink-700 shadow-[8px_8px_0_0_var(--t-shadow)]"
      >
        <BannerImg />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/72 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="chip animate-pulse-gold border-gold-500 bg-gold-400/15 text-gold-300">
              <Zap className="h-3 w-3" /> Preventa activa
            </span>
            <span className="chip border-pb-400/60 bg-pb-400/10 text-pb-300">Llega en 2–3 semanas</span>
          </div>
          <h1 className="font-display max-w-md text-2xl leading-tight font-extrabold text-cream-100 sm:text-4xl">
            Mega Evolution
            <br />
            <span className="text-gold-400">Pitch Black</span>
          </h1>
          <p className="max-w-sm text-sm text-ink-300">
            Reserva hoy con un toque, paga por transferencia o QR y retira en tienda apenas llegue a Quito.
          </p>
        </div>
      </motion.div>

      {/* Cómo funciona */}
      <div className="card-flat flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-ink-700">
        {[
          { icon: <Zap className="h-4 w-4 text-gold-400" />, t: "Reserva en 1 minuto", d: "Eliges producto y cantidad" },
          { icon: <Banknote className="h-4 w-4 text-mint-400" />, t: "Pagas por transferencia o QR", d: "Datos al instante, sin formularios" },
          { icon: <Store className="h-4 w-4 text-pb-300" />, t: "Retiras en tienda", d: "Te avisamos cuando llegue" },
        ].map((s, i) => (
          <div key={i} className="flex flex-1 items-center gap-3 sm:px-5 sm:first:pl-0 sm:last:pr-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink-600 bg-ink-850">
              {s.icon}
            </span>
            <div>
              <div className="text-sm font-bold text-cream-100">{s.t}</div>
              <div className="text-xs text-ink-400">{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Catálogo */}
      <div>
        <SectionHead
          label="Preventa Pitch Black"
          title="Productos de la expansión"
          right={<span className="chip border-ink-600 bg-ink-850 text-ink-300">{PRODUCTS.length} productos</span>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="card-tcg group flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink-700 bg-ink-900">
                <ProductImg
                  src={p.img}
                  fallback={p.fallback}
                  alt={p.name}
                  className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06]"
                />
                {p.tag && (
                  <span className="chip absolute top-2.5 left-2.5 border-gold-500 bg-[#060d12]/80 text-[#ffd97a] backdrop-blur-sm">
                    {p.tag}
                  </span>
                )}
                {p.stock <= 5 && (
                  <span className="chip absolute right-2.5 bottom-2.5 border-coral-500 bg-[#060d12]/80 text-[#ffa196] backdrop-blur-sm">
                    ¡Últimas {p.stock}!
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-bold text-cream-100">{p.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-300">{p.blurb}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.contents.map((c) => (
                    <li key={c} className="flex items-start gap-1.5 text-xs text-ink-300">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-mint-400" strokeWidth={3} />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div>
                    <span className="font-display text-xl font-extrabold text-gold-300">{fmtUSD(p.price)}</span>
                    <span className="ml-1 text-[11px] text-ink-400">c/u</span>
                  </div>
                  <button onClick={() => openReserve(p)} className="btn-gold px-4 py-2">
                    Reservar
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal de reserva */}
      <Modal open={!!reserveFor} onClose={() => setReserveFor(null)}>
        {reserveFor && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.24em] text-gold-400 uppercase">Confirmar reserva</div>
            <div className="mt-3 flex items-center gap-4">
              <ProductImg
                src={reserveFor.img}
                fallback={reserveFor.fallback}
                alt={reserveFor.name}
                className="h-20 w-20 rounded-lg border-2 border-ink-700 bg-ink-900 object-contain p-1"
              />
              <div>
                <h3 className="font-display text-lg leading-tight font-bold text-cream-100">{reserveFor.name}</h3>
                <p className="mt-1 text-sm text-ink-300">{fmtUSD(reserveFor.price)} c/u · stock: {reserveFor.stock}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border-2 border-ink-600 bg-ink-900 px-4 py-3">
              <span className="label-fh mb-0">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="cursor-pointer rounded-md border-2 border-ink-600 bg-ink-800 p-1.5 transition hover:border-gold-400 active:translate-y-px"
                  aria-label="Menos"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <span className="font-display w-8 text-center text-lg font-extrabold text-cream-100">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(Math.min(5, reserveFor.stock), q + 1))}
                  className="cursor-pointer rounded-md border-2 border-ink-600 bg-ink-800 p-1.5 transition hover:border-gold-400 active:translate-y-px"
                  aria-label="Más"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-300">Total a pagar</span>
              <span className="font-display text-2xl font-extrabold text-gold-300">{fmtUSD(qty * reserveFor.price)}</span>
            </div>

            <p className="mt-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-xs leading-relaxed text-ink-300">
              No pagas nada en la app. Al confirmar te mostramos la cuenta para transferir y un QR de pago.
            </p>

            <button onClick={confirm} className="btn-gold mt-4 w-full py-3 text-base">
              Confirmar reserva
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!payRes} onClose={() => setPayRes(null)}>
        {payRes && <PaymentSheet res={payRes} onPaid={onPaid} />}
      </Modal>
    </div>
  );
}

/* ============================ Hoja de pago ============================ */

export function PaymentSheet({ res, onPaid }: { res: Reservation; onPaid: () => void }) {
  const product = productById(res.productId);
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.24em] text-gold-400 uppercase">Datos de pago</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-cream-100">Reserva {res.code}</h3>
          <p className="mt-0.5 text-xs text-ink-300">
            {product?.name} × {res.qty}
          </p>
        </div>
        <span className="font-display text-2xl font-extrabold text-gold-300">{fmtUSD(res.total)}</span>
      </div>

      <div className="mt-4 divide-y divide-ink-800 rounded-lg border-2 border-ink-600 bg-ink-900">
        <PayRow k="Banco" v={`${PAYMENT.bank} · ${PAYMENT.accountType}`} />
        <PayRow k="Nº de cuenta" v={PAYMENT.account} copy={PAYMENT.account.replace(/\s/g, "")} />
        <PayRow k="Titular" v={PAYMENT.holder} copy={PAYMENT.holder} />
        <PayRow k="RUC" v={PAYMENT.ruc} />
        <PayRow k="Referencia" v={res.code} copy={res.code} />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border-2 border-ink-600 bg-ink-900 p-4">
        <div className="rounded-xl bg-[#f6efdd] p-3">
          <QRCodeSVG value={payQrPayload(res.code, res.total)} size={138} fgColor="#0B161D" bgColor="#F6EFDD" />
        </div>
        <p className="text-center text-xs text-ink-300">
          O escanea este QR con tu app de banca / billetera
        </p>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-lg border border-mint-500/40 bg-mint-500/5 px-3 py-2.5 text-xs leading-relaxed text-ink-300">
        <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
        Envía tu comprobante al WhatsApp <b className="text-cream-100">{PAYMENT.whatsapp}</b> o por DM de Facebook para
        confirmar más rápido.
      </p>

      <button onClick={onPaid} className="btn-mint mt-4 w-full py-3 text-base">
        <Check className="h-4 w-4" strokeWidth={3} />
        Ya realicé el pago
      </button>
    </div>
  );
}

function PayRow({ k, v, copy }: { k: string; v: string; copy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="text-[10px] font-bold tracking-[0.18em] text-ink-400 uppercase">{k}</span>
      <span className="flex items-center gap-2 text-right text-sm font-bold text-cream-100">
        {v}
        {copy && <CopyBtn text={copy} />}
      </span>
    </div>
  );
}

/* ============================ Mis reservas ============================ */

const STEPS = [
  { key: "pendiente_pago", label: "Reserva" },
  { key: "pago_por_verificar", label: "Pago enviado" },
  { key: "pago_confirmado", label: "Confirmado" },
  { key: "listo_retiro", label: "En tienda" },
] as const;

export function MyReservations({ user, onGoShop }: { user: User; onGoShop: () => void }) {
  const { state, setReservationStatus } = useStore();
  const { push } = useToast();
  const [payRes, setPayRes] = useState<Reservation | null>(null);

  const mine = state.reservations
    .filter((r) => r.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const onPaid = () => {
    if (!payRes) return;
    setReservationStatus(payRes.id, "pago_por_verificar");
    confettiBurst();
    push("¡Gracias! Verificaremos tu pago muy pronto");
    setPayRes(null);
  };

  return (
    <div className="space-y-5">
      <SectionHead
        label="Seguimiento"
        title="Mis reservas"
        right={
          <button onClick={onGoShop} className="btn-ghost px-3.5 py-2 text-xs">
            <Package className="h-3.5 w-3.5" /> Nueva reserva
          </button>
        }
      />

      {mine.length === 0 ? (
        <div className="card-flat flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Package className="h-9 w-9 text-ink-500" />
          <p className="text-sm font-semibold text-ink-300">Todavía no tienes reservas.</p>
          <button onClick={onGoShop} className="btn-gold">
            Explorar la preventa Pitch Black
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {mine.map((r, i) => {
            const p = productById(r.productId);
            const idx = r.status === "entregado" ? 4 : STEPS.findIndex((s) => s.key === r.status);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-tcg p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {p && (
                    <ProductImg
                      src={p.img}
                      fallback={p.fallback}
                      alt={p.name}
                      className="h-24 w-24 shrink-0 rounded-lg border-2 border-ink-700 bg-ink-900 object-contain p-1"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-cream-100">{p?.name ?? "Producto"}</h3>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-300">
                      <span className="font-mono font-bold tracking-widest text-gold-300">{r.code}</span>
                      <span>
                        {r.qty} × {fmtUSD(r.total / r.qty)}
                      </span>
                      <span className="font-display text-sm font-extrabold text-cream-100">{fmtUSD(r.total)}</span>
                      <span>Reservada el {shortDate(r.createdAt)}</span>
                    </div>

                    {r.status !== "cancelado" && (
                      <div className="mt-4 flex items-center">
                        {STEPS.map((s, si) => (
                          <div key={s.key} className={`flex items-center ${si < STEPS.length - 1 ? "flex-1" : ""}`}>
                            <div className="flex flex-col items-center">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  si < idx
                                    ? "border-gold-500 bg-gold-400 text-ink-950"
                                    : si === idx
                                      ? "animate-pulse-gold border-gold-400 bg-ink-850"
                                      : "border-ink-600 bg-ink-900"
                                }`}
                              >
                                {si < idx && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                                {si === idx && <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />}
                              </span>
                              <span className={`mt-1 text-[9px] font-bold tracking-wide uppercase ${si <= idx ? "text-gold-300" : "text-ink-500"}`}>
                                {s.label}
                              </span>
                            </div>
                            {si < STEPS.length - 1 && (
                              <div className={`mx-1.5 mb-4 h-0.5 flex-1 rounded ${si < idx ? "bg-gold-500" : "bg-ink-700"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end sm:justify-between">
                    {(r.status === "pendiente_pago" || r.status === "pago_por_verificar") && (
                      <button onClick={() => setPayRes(r)} className="btn-gold px-3.5 py-2 text-xs">
                        <Banknote className="h-3.5 w-3.5" />
                        {r.status === "pendiente_pago" ? "Ver datos de pago" : "Datos de pago"}
                      </button>
                    )}
                    {r.status === "pendiente_pago" && (
                      <button
                        onClick={() => {
                          setReservationStatus(r.id, "cancelado");
                          push("Reserva cancelada. ¡Vuelve cuando quieras!", "info");
                        }}
                        className="cursor-pointer text-xs font-bold text-ink-400 underline-offset-2 transition hover:text-coral-400 hover:underline"
                      >
                        Cancelar reserva
                      </button>
                    )}
                    {r.status === "pago_por_verificar" && r.paidAt && (
                      <span className="text-[11px] text-ink-400">Pago enviado {timeAgo(r.paidAt)}</span>
                    )}
                    {r.status === "listo_retiro" && (
                      <span className="chip border-pb-400/60 bg-pb-400/10 text-pb-300">
                        Trae tu código {r.code}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={!!payRes} onClose={() => setPayRes(null)}>
        {payRes && <PaymentSheet res={payRes} onPaid={onPaid} />}
      </Modal>
    </div>
  );
}
