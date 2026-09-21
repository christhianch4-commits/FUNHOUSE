import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, Trash2, Upload, X } from "lucide-react";
import { useStore } from "../lib/store";
import { shortDate } from "../lib/data";
import { readAndCompressImage, SectionHead, useToast } from "../components/ui";

export default function NewsView() {
  const { currentUser, state, createNewsPost, deleteNewsPost, markNewsSeen } = useStore();
  const { push } = useToast();
  const isAdmin = currentUser?.role === "admin";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) markNewsSeen(currentUser.id);
  }, [currentUser?.id, markNewsSeen]);

  if (!currentUser) return null;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readAndCompressImage(file);
      setImage(dataUrl);
    } catch {
      push("No pudimos leer esa imagen. Prueba con otra foto.", "err");
    } finally {
      setBusy(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      push("Ponle un título a la publicación.", "err");
      return;
    }
    createNewsPost(title.trim(), description.trim(), image, currentUser.name);
    setTitle("");
    setDescription("");
    clearImage();
    push("¡Publicado en el muro de noticias!");
  };

  const posts = [...state.news].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <SectionHead
        label="Comunidad"
        title="Muro de noticias"
        right={
          <span className="chip border-ink-600 bg-ink-850 text-ink-300">
            <Megaphone className="h-3 w-3" /> {posts.length}
          </span>
        }
      />

      {isAdmin && (
        <form onSubmit={submit} className="card-tcg space-y-4 p-5">
          <div className="text-[10px] font-bold tracking-[0.24em] text-gold-400 uppercase">
            Nueva publicación
          </div>

          <div>
            <label className="label-fh">Título</label>
            <input
              className="input-fh"
              placeholder="Ej. Torneo Pokémon TCG — ¡tenemos ganador!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label-fh">Descripción breve</label>
            <textarea
              className="input-fh min-h-[84px] resize-none"
              placeholder="Cuenta brevemente qué pasó, cuándo es el próximo evento, quién ganó…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label-fh">Foto</label>
            {image ? (
              <div className="relative overflow-hidden rounded-lg border-2 border-ink-600">
                <img src={image} alt="Vista previa" className="h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
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

          <button type="submit" className="btn-gold w-full py-2.5">
            Publicar en el muro
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="card-flat flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Megaphone className="h-8 w-8 text-ink-500" />
          <p className="text-sm font-semibold text-ink-300">Todavía no hay publicaciones.</p>
          {isAdmin && (
            <p className="max-w-sm text-xs text-ink-400">
              Usa el formulario de arriba para anunciar tu próximo torneo o subir la foto de los ganadores.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {posts.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.04 * i }}
                className="card-tcg flex flex-col overflow-hidden"
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-44 w-full border-b-2 border-ink-700 object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center border-b-2 border-ink-700 bg-ink-900">
                    <Megaphone className="h-9 w-9 text-ink-600" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base font-bold text-cream-100">{p.title}</h3>
                  {p.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-300">{p.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-ink-400">
                    <span>
                      {p.author} · {shortDate(p.createdAt)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteNewsPost(p.id)}
                        aria-label="Eliminar publicación"
                        className="cursor-pointer text-ink-400 transition hover:text-coral-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
