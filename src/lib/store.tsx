import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  cashbackFor,
  seedCashbackLog,
  seedLoyaltyTiers,
  seedNews,
  seedProducts,
  seedPromos,
  seedReservations,
  seedSplashPromo,
  seedUsers,
  seedVisitLog,
  tierForLevel,
  uid,
  shortCode,
  type CashbackEntry,
  type LoyaltyTier,
  type NewsPost,
  type Product,
  type PromoAccent,
  type PromoSlide,
  type Reservation,
  type ResStatus,
  type SplashPromo,
  type User,
  type VisitEntry,
} from "./data";

interface State {
  users: User[];
  visitLog: VisitEntry[];
  reservations: Reservation[];
  news: NewsPost[];
  promos: PromoSlide[];
  products: Product[];
  splashPromo: SplashPromo;
  cashbackLog: CashbackEntry[];
  loyaltyTiers: LoyaltyTier[];
  sessionId: string | null;
}

const KEY = "fh-tcg-state-v2";

const migrateBrand = (state: State): State => ({
  ...state,
  users: state.users.map((user) => ({
    ...user,
    name:
      user.name === "Admin Fun House" || user.name === "Admin Habemus Juegos"
        ? "Admin Panda Mangas"
        : user.name,
    rewards: user.rewards.map((reward) => ({
      ...reward,
      title: reward.title.replace(/Fun House|Habemus Juegos/g, "Panda Mangas"),
    })),
    lastSeenNewsAt: user.lastSeenNewsAt ?? null,
    lastSeenReservationsAt: user.lastSeenReservationsAt ?? null,
    lastSeenSplashAt: user.lastSeenSplashAt ?? null,
    cashbackBalance: user.cashbackBalance ?? 0,
  })),
  reservations: state.reservations.map((r) => ({
    ...r,
    statusUpdatedAt: r.statusUpdatedAt ?? r.paidAt ?? r.createdAt,
  })),
});

const load = (): State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length) {
        const migrated = migrateBrand(parsed);
        return {
          ...migrated,
          news: migrated.news ?? seedNews(),
          promos: migrated.promos ?? seedPromos(),
          products: migrated.products ?? seedProducts(),
          splashPromo: migrated.splashPromo ?? seedSplashPromo(),
          cashbackLog: migrated.cashbackLog ?? seedCashbackLog(),
          loyaltyTiers: migrated.loyaltyTiers ?? seedLoyaltyTiers(),
        };
      }
    }
  } catch {
    /* seed */
  }
  return {
    users: seedUsers(),
    visitLog: seedVisitLog(),
    reservations: seedReservations(),
    news: seedNews(),
    promos: seedPromos(),
    products: seedProducts(),
    splashPromo: seedSplashPromo(),
    cashbackLog: seedCashbackLog(),
    loyaltyTiers: seedLoyaltyTiers(),
    sessionId: null,
  };
};

export type VisitResult =
  | { ok: true; user: User; unlocked: boolean }
  | { ok: false; reason: "notfound" }
  | { ok: false; reason: "dup"; user: User };

interface StoreApi {
  state: State;
  currentUser: User | null;
  login: (email: string, pass: string) => string | null;
  register: (name: string, email: string, pass: string) => string | null;
  logout: () => void;
  recordVisit: (userId: string) => VisitResult;
  registerVisitByCode: (raw: string) => VisitResult;
  requestReward: (userId: string) => string | null;
  deliverReward: (userId: string, rewardId: string) => void;
  adjustVisits: (userId: string, delta: number) => void;
  createReservation: (userId: string, productId: string, qty: number, total: number) => Reservation;
  setReservationStatus: (id: string, status: ResStatus) => void;
  userById: (id: string) => User | undefined;
  userName: (id: string) => string;
  createNewsPost: (title: string, description: string, image: string | null, author: string) => void;
  deleteNewsPost: (id: string) => void;
  createPromoSlide: (
    kicker: string,
    title: string,
    subtitle: string,
    image: string | null,
    accent: PromoAccent
  ) => void;
  deletePromoSlide: (id: string) => void;
  movePromoSlide: (id: string, direction: -1 | 1) => void;
  markNewsSeen: (userId: string) => void;
  markReservationsSeen: (userId: string) => void;
  createProduct: (name: string, blurb: string, price: number, image: string, stock: number) => void;
  deleteProduct: (id: string) => void;
  updateSplashPromo: (active: boolean, image: string | null, title: string, subtitle: string) => void;
  markSplashSeen: (userId: string) => void;
  addCashbackFromPurchase: (userId: string, purchaseAmount: number) => number;
  updateLoyaltyTierPrize: (stars: 1 | 2 | 3, prize: string) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage lleno */
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.sessionId) ?? null,
    [state.users, state.sessionId]
  );

  const login = useCallback(
    (email: string, pass: string) => {
      const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u) return "No encontramos una cuenta con ese correo.";
      if (u.pass !== pass) return "Contraseña incorrecta. Intenta de nuevo.";
      setState((s) => ({ ...s, sessionId: u.id }));
      return null;
    },
    [state.users]
  );

  const register = useCallback(
    (name: string, email: string, pass: string) => {
      if (!name.trim()) return "Escribe tu nombre completo.";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Ese correo no parece válido.";
      if (pass.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (state.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
        return "Ya existe una cuenta con ese correo. Inicia sesión.";
      const u: User = {
        id: uid("u"),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pass,
        role: "player",
        code: shortCode("FH"),
        visits: 0,
        cardsCompleted: 0,
        rewards: [],
        createdAt: new Date().toISOString(),
        lastVisitAt: null,
        hue: Math.floor(Math.random() * 360),
        lastSeenNewsAt: null,
        lastSeenReservationsAt: null,
        lastSeenSplashAt: null,
        cashbackBalance: 0,
      };
      setState((s) => ({ ...s, users: [...s.users, u], sessionId: u.id }));
      return null;
    },
    [state.users]
  );

  const logout = useCallback(() => setState((s) => ({ ...s, sessionId: null })), []);

  const recordVisit = useCallback(
    (userId: string): VisitResult => {
      const u = state.users.find((x) => x.id === userId);
      if (!u) return { ok: false, reason: "notfound" };
      if (u.lastVisitAt && Date.now() - new Date(u.lastVisitAt).getTime() < 90_000)
        return { ok: false, reason: "dup", user: u };
      const visits = u.visits + 1;
      const unlocked = visits % 10 === 0;
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        users: s.users.map((x) => (x.id === userId ? { ...x, visits, lastVisitAt: now } : x)),
        visitLog: [{ id: uid("v"), userId, at: now }, ...s.visitLog].slice(0, 500),
      }));
      return { ok: true, user: { ...u, visits }, unlocked };
    },
    [state.users]
  );

  const registerVisitByCode = useCallback(
    (raw: string): VisitResult => {
      const clean = raw.trim().toUpperCase();
      if (!clean) return { ok: false, reason: "notfound" };
      const byQr = state.users.find((x) => `FH:${x.id}`.toUpperCase() === clean);
      const byCode = state.users.find((x) => x.code.toUpperCase() === clean);
      const u = byQr ?? byCode;
      if (!u) return { ok: false, reason: "notfound" };
      return recordVisit(u.id);
    },
    [state.users, recordVisit]
  );

  const requestReward = useCallback(
    (userId: string): string | null => {
      const u = state.users.find((x) => x.id === userId);
      if (!u) return null;
      const canClaim = Math.floor(u.visits / 10) - u.cardsCompleted;
      if (canClaim <= 0) return null;
      const level = u.cardsCompleted + 1;
      const code = `PRM-${Math.floor(1000 + Math.random() * 9000)}`;
      const title = tierForLevel(level).title;
      setState((s) => ({
        ...s,
        users: s.users.map((x) =>
          x.id === userId
            ? {
                ...x,
                cardsCompleted: x.cardsCompleted + 1,
                rewards: [
                  {
                    id: uid("r"),
                    level,
                    title,
                    code,
                    requestedAt: new Date().toISOString(),
                    deliveredAt: null,
                  },
                  ...x.rewards,
                ],
              }
            : x
        ),
      }));
      return code;
    },
    [state.users]
  );

  const deliverReward = useCallback((userId: string, rewardId: string) => {
    setState((s) => ({
      ...s,
      users: s.users.map((x) =>
        x.id === userId
          ? {
              ...x,
              rewards: x.rewards.map((r) =>
                r.id === rewardId ? { ...r, deliveredAt: new Date().toISOString() } : r
              ),
            }
          : x
      ),
    }));
  }, []);

  const adjustVisits = useCallback((userId: string, delta: number) => {
    setState((s) => ({
      ...s,
      users: s.users.map((x) =>
        x.id === userId ? { ...x, visits: Math.max(0, x.visits + delta) } : x
      ),
    }));
  }, []);

  const createReservation = useCallback(
    (userId: string, productId: string, qty: number, total: number): Reservation => {
      const r: Reservation = {
        id: uid("res"),
        code: shortCode("PB"),
        userId,
        productId,
        qty,
        total,
        status: "pendiente_pago",
        createdAt: new Date().toISOString(),
        paidAt: null,
        statusUpdatedAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, reservations: [r, ...s.reservations] }));
      return r;
    },
    []
  );

  const setReservationStatus = useCallback((id: string, status: ResStatus) => {
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              paidAt: status === "pago_por_verificar" ? new Date().toISOString() : r.paidAt,
              statusUpdatedAt: new Date().toISOString(),
            }
          : r
      ),
    }));
  }, []);

  const userById = useCallback(
    (id: string) => state.users.find((u) => u.id === id),
    [state.users]
  );

  const userName = useCallback(
    (id: string) => state.users.find((u) => u.id === id)?.name ?? "Jugador",
    [state.users]
  );

  const createNewsPost = useCallback(
    (title: string, description: string, image: string | null, author: string) => {
      const post: NewsPost = {
        id: uid("news"),
        title,
        description,
        image,
        author,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, news: [post, ...s.news] }));
    },
    []
  );

  const deleteNewsPost = useCallback((id: string) => {
    setState((s) => ({ ...s, news: s.news.filter((n) => n.id !== id) }));
  }, []);

  const createPromoSlide = useCallback(
    (kicker: string, title: string, subtitle: string, image: string | null, accent: PromoAccent) => {
      const slide: PromoSlide = {
        id: uid("promo"),
        kicker,
        title,
        subtitle,
        image,
        accent,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, promos: [...s.promos, slide] }));
    },
    []
  );

  const deletePromoSlide = useCallback((id: string) => {
    setState((s) => ({ ...s, promos: s.promos.filter((p) => p.id !== id) }));
  }, []);

  const movePromoSlide = useCallback((id: string, direction: -1 | 1) => {
    setState((s) => {
      const idx = s.promos.findIndex((p) => p.id === id);
      const swapWith = idx + direction;
      if (idx === -1 || swapWith < 0 || swapWith >= s.promos.length) return s;
      const next = [...s.promos];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return { ...s, promos: next };
    });
  }, []);

  const markNewsSeen = useCallback((userId: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, lastSeenNewsAt: now } : u)),
    }));
  }, []);

  const markReservationsSeen = useCallback((userId: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, lastSeenReservationsAt: now } : u)),
    }));
  }, []);

  const createProduct = useCallback(
    (name: string, blurb: string, price: number, image: string, stock: number) => {
      const p: Product = {
        id: uid("prod"),
        name,
        blurb,
        contents: [],
        price,
        img: image,
        fallback: image,
        stock,
      };
      setState((s) => ({ ...s, products: [p, ...s.products] }));
    },
    []
  );

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  }, []);

  const updateSplashPromo = useCallback(
    (active: boolean, image: string | null, title: string, subtitle: string) => {
      setState((s) => ({
        ...s,
        splashPromo: { active, image, title, subtitle, updatedAt: new Date().toISOString() },
      }));
    },
    []
  );

  const markSplashSeen = useCallback((userId: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, lastSeenSplashAt: now } : u)),
    }));
  }, []);

  const addCashbackFromPurchase = useCallback((userId: string, purchaseAmount: number) => {
    const amount = cashbackFor(purchaseAmount);
    const entry: CashbackEntry = {
      id: uid("cb"),
      userId,
      purchaseAmount,
      cashbackAmount: amount,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, cashbackBalance: Math.round((u.cashbackBalance + amount) * 100) / 100 } : u
      ),
      cashbackLog: [entry, ...s.cashbackLog],
    }));
    return amount;
  }, []);

  const updateLoyaltyTierPrize = useCallback((stars: 1 | 2 | 3, prize: string) => {
    setState((s) => ({
      ...s,
      loyaltyTiers: s.loyaltyTiers.map((t) => (t.stars === stars ? { ...t, prize } : t)),
    }));
  }, []);

  const api: StoreApi = {
    state,
    currentUser,
    login,
    register,
    logout,
    recordVisit,
    registerVisitByCode,
    requestReward,
    deliverReward,
    adjustVisits,
    createReservation,
    setReservationStatus,
    userById,
    createNewsPost,
    deleteNewsPost,
    createPromoSlide,
    deletePromoSlide,
    movePromoSlide,
    markNewsSeen,
    markReservationsSeen,
    createProduct,
    deleteProduct,
    updateSplashPromo,
    markSplashSeen,
    addCashbackFromPurchase,
    updateLoyaltyTierPrize,
    userName,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
