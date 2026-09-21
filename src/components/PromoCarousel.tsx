import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Megaphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { PromoAccent } from "../lib/data";
import { readAndCompressImage, useToast } from "./ui";

const ACCENT_CHIP: Record<PromoAccent, string> = {
  gold: "border-gold-500 bg-gold-400/15 text-gold-300",
  mint: "border-mint-500/60 bg-mint-500/10 text-mint-300",
  coral: "border-coral-500/60 bg-coral-500/10 text-coral-300",
  pb: "border-pb-400/60 bg-pb-400/10 text-pb-300",
};

const ACCENT_DOT: Record<PromoAccent, string> = {
  gold: "bg-gold-400",
  mint: "bg-mint-400",
  coral: "bg-coral-400",
  pb: "bg-pb-400",
};

const ACCENT_OPTIONS: { key: PromoAccent; label: string; swatch: string }[] = [
  { key: "gold", label: "Verde", swatch: "bg-gold-400" },
  { key: "mint", label: "Turquesa", swatch: "bg-mint-400" },
  { key: "coral", label: "Coral", swatch: "bg-coral-400" },
  { key: "pb", label: "Morado", swatch: "bg-pb-400" },
];

/** Banner giratorio para promos, avisos de reserva o publicidad de producto. */
export default function PromoCarousel() {
  const { currentUser, state, createPromoSlide, deletePromoSlide, movePromoSlide } = useStore();
  const { push } = useToast();
  const isAdmin = currentUser?.role === "admin";
  const slides = state.promos;

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const go = (d: 1 | -1) => {
    setDir(d);
    setIndex((i) => (i + d + slides.length) % slides.length);
  };

  const [showForm, setShowForm] = useState(false);
  const [kicker, setKicker] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [accent, setAccent] = useState<PromoAccent>("gold");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
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
    setKicker("");
    setTitle("");
    setSubtitle("");
    setImage(null);
    setAccent("gold");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      push("Ponle un título al banner.", "err");
      return;
    }
    createPromoSlide(kicker.trim() || "Promo", title.trim(), subtitle.trim(), image, accent);
    resetForm();
    push("¡Banner agregado al carrusel!");
  };

  if (slides.length === 0 && !isAdmin) return null;

  const slide = slides[index];

  return (
    <div className="space-y-3">
      {slide ? (
        <div className="relative overflow-hidden rounded-xl border-2 border-ink-700 shadow-[8px_8px_0_0_var(--t-shadow)]">
          <div className="relative h-56 w-full sm:h-64">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: dir > 0 ? 44 : -44 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir > 0 ? -44 : 44 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {slide.image ? (
                  <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-ink-700 via-ink-900 to-ink-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/72 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-8">
                  <span className={`chip w-fit ${ACCENT_CHIP[slide.accent]}`}>
                    <Megaphone className="h-3 w-3" /> {slide.kicker}
                  </span>
                  <h2 className="font-display max-w-md text-2xl leading-tight font-extrabold text-cream-100 sm:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle && <p className="max-w-sm text-sm text-ink-300">{slide.subtitle}</p>}
                </div>
              </motion.div>
            </AnimatePresence>

            {slides.length > 1 && (
              <>
                <button
                  onClick={() => go(-1)}
                  aria-label="Banner anterior"
                  className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-full border-2 border-ink-600 bg-ink-950/55 p-1.5 text-cream-100 backdrop-blur-sm transition hover:border-gold-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="Siguiente banner"
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full border-2 border-ink-600 bg-ink-950/55 p-1.5 text-cream-100 backdrop-blur-sm transition hover:border-gold-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setDir(i > index ? 1 : -1);
                        setIndex(i);
                      }}
                      aria-label={`Ir al banner ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? `w-6 ${ACCENT_DOT[slide.accent]}` : "w-1.5 bg-ink-500/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card-flat flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Megaphone className="h-7 w-7 text-ink-500" />
          <p className="text-sm font-semibold text-ink-300">Todavía no hay banners en el carrusel.</p>
        </div>
      )}

      {isAdmin && (
        <div className="card-flat p-4">
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-ghost w-full text-xs">
            <Sparkles className="h-3.5 w-3.5" /> {showForm ? "Cerrar gestor de banners" : "Gestionar banners del carrusel"}
          </button>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={submit} className="mt-4 space-y-3 border-t border-ink-700 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label-fh">Etiqueta corta</label>
                      <input
                        className="input-fh"
                        placeholder="Ej. Promo, Reserva ya, Novedad"
                        value={kicker}
                        onChange={(e) => setKicker(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-fh">Color</label>
                      <div className="flex h-[42px] items-center gap-2">
                        {ACCENT_OPTIONS.map((a) => (
                          <button
                            key={a.key}
                            type="button"
                            onClick={() => setAccent(a.key)}
                            aria-label={a.label}
                            className={`h-7 w-7 cursor-pointer rounded-full ${a.swatch} transition ${
                              accent === a.key ? "ring-2 ring-cream-100 ring-offset-2 ring-offset-ink-850" : "opacity-60"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-fh">Título</label>
                    <input
                      className="input-fh"
                      placeholder="Ej. Cups de TCG todos los sábados"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label-fh">Descripción breve</label>
                    <textarea
                      className="input-fh min-h-[70px] resize-none"
                      placeholder="Cuenta la promo, cómo reservar o qué producto destacar…"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label-fh">Foto (opcional)</label>
                    {image ? (
                      <div className="relative overflow-hidden rounded-lg border-2 border-ink-600">
                        <img src={image} alt="Vista previa" className="h-32 w-full object-cover" />
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
                        className="btn-ghost w-full border-dashed py-4 text-xs disabled:opacity-60"
                      >
                        {busy ? "Procesando…" : "Subir foto"}
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                  </div>

                  <button type="submit" className="btn-gold w-full py-2.5">
                    Agregar al carrusel
                  </button>
                </form>

                {slides.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-ink-700 pt-4">
                    {slides.map((s, i) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs"
                      >
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                        <span className="min-w-0 flex-1 truncate font-semibold text-cream-100">{s.title}</span>
                        <button
                          type="button"
                          onClick={() => movePromoSlide(s.id, -1)}
                          disabled={i === 0}
                          aria-label="Mover antes"
                          className="cursor-pointer text-ink-300 transition hover:text-gold-300 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePromoSlide(s.id, 1)}
                          disabled={i === slides.length - 1}
                          aria-label="Mover después"
                          className="cursor-pointer text-ink-300 transition hover:text-gold-300 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePromoSlide(s.id)}
                          aria-label="Eliminar banner"
                          className="cursor-pointer text-ink-400 transition hover:text-coral-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
