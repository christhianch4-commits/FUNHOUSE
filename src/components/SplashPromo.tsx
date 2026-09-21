import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useStore } from "../lib/store";
import { shouldShowSplash } from "../lib/data";

/** Promo del mes/temporada: aparece como bienvenida al abrir la app (una vez por promo). */
export default function SplashPromoModal({ onGoShop }: { onGoShop: () => void }) {
  const { currentUser, state, markSplashSeen } = useStore();

  if (!currentUser || currentUser.role !== "player") return null;

  const { splashPromo } = state;
  const open = shouldShowSplash(currentUser, splashPromo);
  const close = () => markSplashSeen(currentUser.id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#070f0a]/85 p-4 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="card-tcg holo-sheen relative w-full max-w-sm overflow-hidden p-0"
          >
            <button
              onClick={close}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 cursor-pointer rounded-full border-2 border-ink-600 bg-ink-950/60 p-1.5 text-cream-100 backdrop-blur-sm transition hover:border-coral-400"
            >
              <X className="h-4 w-4" />
            </button>

            {splashPromo.image && (
              <img
                src={splashPromo.image}
                alt={splashPromo.title}
                className="max-h-[65vh] w-full object-cover"
              />
            )}

            <div className="p-5">
              <h2 className="font-display text-xl leading-tight font-extrabold text-cream-100">
                {splashPromo.title}
              </h2>
              {splashPromo.subtitle && (
                <p className="mt-1.5 text-sm text-ink-300">{splashPromo.subtitle}</p>
              )}
              <button
                onClick={() => {
                  close();
                  onGoShop();
                }}
                className="btn-gold mt-4 w-full py-2.5"
              >
                Ver en la tienda
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
