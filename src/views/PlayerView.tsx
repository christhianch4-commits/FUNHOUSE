import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, Check, Gift, QrCode, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { claimableCards, shortDate, timeAgo, tierForLevel, type User } from "../lib/data";
import { confettiBurst, SectionHead, StampCard, useToast } from "../components/ui";
import Shop, { MyReservations } from "./ShopView";

export default function PlayerView({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  if (tab === "tienda") return <Shop user={currentUser} />;
  if (tab === "reservas") return <MyReservations user={currentUser} onGoShop={() => setTab("tienda")} />;
  return <MyPass user={currentUser} />;
}

function MyPass({ user }: { user: User }) {
  const { requestReward } = useStore();
  const { push } = useToast();
  const claimable = claimableCards(user) > 0;
  const nextLevel = user.cardsCompleted + 1;
  const nextTier = tierForLevel(nextLevel + (claimable ? 1 : 0));
  const delivered = user.rewards.filter((r) => r.deliveredAt).length;
  const pending = user.rewards.filter((r) => !r.deliveredAt);

  const onClaim = () => {
    const code = requestReward(user.id);
    if (code) {
      confettiBurst();
      push(`¡Premio canjeado! Tu código es ${code} — preséntalo en tienda`, "info");
    }
  };

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="text-[10px] font-bold tracking-[0.28em] text-gold-400 uppercase">
            Mi pase · Fun House
          </div>
          <h1 className="font-display mt-1 text-2xl font-extrabold text-cream-100 sm:text-3xl">
            ¡Hola, {user.name.split(" ")[0]}!
          </h1>
          <p className="mt-1.5 text-sm text-ink-300">
            Escanea tu pase en caja cada vez que vengas — cada escaneo es un sello.
          </p>
        </div>
        <div className="flex gap-2.5">
          <StatTile label="Visitas" value={String(user.visits)} accent="text-gold-300" />
          <StatTile label="Tarjetas" value={String(user.cardsCompleted)} accent="text-mint-300" />
          <StatTile label="Premios" value={String(delivered)} accent="text-coral-300" />
        </div>
      </motion.div>

      {/* Pase + tarjeta de sellos */}
      <div className="grid gap-5 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="card-tcg holo-sheen p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.24em] text-ink-300 uppercase">
              Tu pase QR
            </span>
            <span className="chip border-mint-500/60 bg-mint-500/10 text-mint-300">
              <QrCode className="h-3 w-3" /> Activo
            </span>
          </div>
          <div className="mt-4 flex justify-center rounded-xl bg-[#f6efdd] p-5">
            <QRCodeSVG value={`FH:${user.id}`} size={176} fgColor="#0B161D" bgColor="#F6EFDD" level="M" />
          </div>
          <div className="mt-4 text-center">
            <div className="font-display text-lg font-extrabold text-cream-100">{user.name}</div>
            <div className="mt-0.5 font-mono text-sm font-bold tracking-widest text-gold-300">{user.code}</div>
          </div>
          <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-center text-xs leading-relaxed text-ink-300">
            Muéstralo en caja para registrar tu visita.
            <br />
            ¿Sin señal? También sirve tu código <b className="text-cream-100">{user.code}</b>.
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
            <CalendarDays className="h-3.5 w-3.5" /> Jugador desde {shortDate(user.createdAt)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="lg:col-span-3"
        >
          <StampCard user={user} onClaim={onClaim} />

          {/* Próximo premio */}
          <div className="card-flat mt-4 flex items-center gap-4 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-pb-400/50 bg-pb-400/10">
              <Sparkles className="h-5 w-5 text-pb-300" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.2em] text-ink-400 uppercase">
                {claimable ? "Después de canjear, la siguiente tarjeta da" : "Siguiente gran recompensa"}
              </div>
              <div className="font-display mt-0.5 truncate text-sm font-bold text-cream-100">
                Nivel {nextLevel + (claimable ? 1 : 0)} · {nextTier.title}
              </div>
            </div>
            <div className="ml-auto hidden text-right text-xs text-ink-400 sm:block">
              Pokémon · Yu-Gi-Oh!
              <br />
              Magic y más
            </div>
          </div>
        </motion.div>
      </div>

      {/* Premios */}
      <div>
        <SectionHead label="Recompensas" title="Tus premios canjeados" />
        {user.rewards.length === 0 ? (
          <div className="card-flat flex flex-col items-center gap-2 px-6 py-10 text-center">
            <Gift className="h-8 w-8 text-ink-500" />
            <p className="text-sm font-semibold text-ink-300">Aún no has canjeado premios.</p>
            <p className="max-w-sm text-xs text-ink-400">
              Completa tu primera tarjeta de 10 sellos y podrás reclamar un sobre Pitch Black de cortesía.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {user.rewards.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card-flat flex items-center gap-3.5 p-4 ${r.deliveredAt ? "" : "border-gold-500/50"}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
                    r.deliveredAt
                      ? "border-mint-500/50 bg-mint-500/10"
                      : "animate-pulse-gold border-gold-500/60 bg-gold-500/10"
                  }`}
                >
                  {r.deliveredAt ? (
                    <Check className="h-5 w-5 text-mint-400" strokeWidth={3} />
                  ) : (
                    <Gift className="h-5 w-5 text-gold-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display truncate text-sm font-bold text-cream-100">{r.title}</span>
                    <span className="chip shrink-0 border-ink-600 bg-ink-800 text-ink-300">Nv {r.level}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-xs font-bold tracking-widest text-gold-300">{r.code}</div>
                </div>
                <div className="shrink-0 text-right text-[11px] leading-tight">
                  {r.deliveredAt ? (
                    <>
                      <div className="font-bold text-mint-300">Entregado</div>
                      <div className="text-ink-400">{shortDate(r.deliveredAt)}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-gold-300">Pendiente</div>
                      <div className="text-ink-400">preséntalo en tienda</div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Actividad reciente */}
      {user.lastVisitAt && (
        <div className="card-flat flex items-center gap-3 px-4 py-3 text-sm text-ink-300">
          <span className="h-2 w-2 animate-blink rounded-full bg-mint-400" />
          Tu última visita fue <b className="text-cream-100">{timeAgo(user.lastVisitAt)}</b>. ¡Te vemos pronto en la tienda!
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card-flat min-w-[86px] px-4 py-3 text-center">
      <div className={`font-display text-xl leading-none font-extrabold ${accent}`}>{value}</div>
      <div className="mt-1.5 text-[10px] font-bold tracking-[0.18em] text-ink-400 uppercase">{label}</div>
    </div>
  );
}
