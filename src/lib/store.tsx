import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  seedReservations,
  seedUsers,
  seedVisitLog,
  tierForLevel,
  uid,
  shortCode,
  type Reservation,
  type ResStatus,
  type User,
  type VisitEntry,
} from "./data";

interface State {
  users: User[];
  visitLog: VisitEntry[];
  reservations: Reservation[];
  sessionId: string | null;
}

const KEY = "fh-tcg-state-v2";

const load = (): State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length) return parsed;
    }
  } catch {
    /* seed */
  }
  return {
    users: seedUsers(),
    visitLog: seedVisitLog(),
    reservations: seedReservations(),
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
    userName,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
