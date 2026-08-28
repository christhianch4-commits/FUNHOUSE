export type Role = "admin" | "player";

export interface PendingReward {
  id: string;
  level: number;
  title: string;
  code: string;
  requestedAt: string;
  deliveredAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pass: string;
  role: Role;
  code: string;
  visits: number;
  cardsCompleted: number;
  rewards: PendingReward[];
  createdAt: string;
  lastVisitAt: string | null;
  hue: number;
}

export interface VisitEntry {
  id: string;
  userId: string;
  at: string;
}

export type ResStatus =
  | "pendiente_pago"
  | "pago_por_verificar"
  | "pago_confirmado"
  | "listo_retiro"
  | "entregado"
  | "cancelado";

export interface Reservation {
  id: string;
  code: string;
  userId: string;
  productId: string;
  qty: number;
  total: number;
  status: ResStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface Product {
  id: string;
  name: string;
  blurb: string;
  contents: string[];
  price: number;
  img: string;
  fallback: string;
  stock: number;
  tag?: string;
}

/* ---------- Recompensas por tarjeta completada ---------- */

export interface RewardTier {
  title: string;
  desc: string;
}

export const REWARD_TIERS: RewardTier[] = [
  { title: "Sobre Pitch Black", desc: "1 sobre sellado de Mega Evolution — Pitch Black" },
  { title: "Promo Habemus Juegos", desc: "Carta promo exclusiva de la tienda (full art)" },
  { title: "$5 de descuento", desc: "Válido en cualquier producto de la tienda" },
  { title: "Bundle de 3 sobres", desc: "Tres sobres Pitch Black para tu colección" },
  { title: "Playmat Habemus Juegos", desc: "Tapete de juego edición Quito" },
  { title: "Caja de 12 sobres", desc: "Media display para abrir con tu squad" },
];

export const tierForLevel = (level: number): RewardTier =>
  REWARD_TIERS[(level - 1) % REWARD_TIERS.length];

export const VISITS_PER_CARD = 10;
export const claimableCards = (u: User) =>
  Math.floor(u.visits / VISITS_PER_CARD) - u.cardsCompleted;

export const STORE_INFO = {
  name: "Habemus Juegos",
  description: "Tu tienda de juegos de mesa, rol y TCG en Ecuador.",
  locations: "Quito · Guayaquil",
  catalog: "Más de 1.100 títulos",
  categories: "Juegos de mesa · TCG · Rol · Infantiles · Accesorios",
  email: "hola@habemusjuegos.com",
  instagram: "https://instagram.com/habemusjuegos",
  freeShipping: "Envío gratis desde $80",
  events: "Eventos todas las semanas",
};

/* ---------- Marca / logo ---------- */

/** Foto de perfil real de la página de Facebook (endpoint público estable). */
export const LOGO_FB = "https://graph.facebook.com/FHTCG/picture?type=large";
/** Logo remasterizado en HD (respaldo si Facebook no responde). */
export const LOGO_HD =
  "https://image.qwenlm.ai/generated-images/2b5b12b1-9c6d-428e-ae4b-396b307a79b7/_result.png";

/* ---------- Catálogo: Mega Evolution — Pitch Black ---------- */
/* Fotos reales de producto (referencia: Kantocards) + arte de respaldo */

const K = "https://kantocards.com/cdn/shop/files";
export const PB_BANNER = `${K}/FONDO-colecciones-pc_copia_1.png?v=1773354015&width=1600`;
export const PB_BANNER_FALLBACK =
  "https://image.qwenlm.ai/generated-images/b7547ba2-a86f-4f4a-b427-ebd217ee311a/_result.png";

const GEN = "https://image.qwenlm.ai/generated-images";

export const PRODUCTS: Product[] = [
  {
    id: "pb-display",
    name: "Booster Display · 36 sobres",
    blurb: "La caja sellada de la expansión para abrir sin parar.",
    contents: ["36 sobres sellados ME05 Pitch Black", "Caja sellada · garantía de rarezas"],
    price: 179.99,
    img: `${K}/P11220-ME05_3D_Booster_Display_36ct_Left_EN-3669x5010-b9376e6.png?v=1777560303&width=800`,
    fallback: `${GEN}/e86f6805-8807-406b-a8ea-1ee5781bb864/_result.png`,
    stock: 6,
    tag: "Más pedido",
  },
  {
    id: "pb-etb",
    name: "Elite Trainer Box",
    blurb: "El clásico de todo coleccionista: boosters, promo y accesorios.",
    contents: ["9 sobres + carta promo full-art", "65 fundas, dado, marcadores y caja coleccionable"],
    price: 64.99,
    img: `${K}/P11220-ME05_3D_ETB_OuterSleeve_Left_EN-2711x2584-70f70a8.png?v=1777559192&width=800`,
    fallback: `${GEN}/e86f6805-8807-406b-a8ea-1ee5781bb864/_result.png`,
    stock: 10,
    tag: "Nuevo",
  },
  {
    id: "pb-bundle",
    name: "Booster Bundle · 6 sobres",
    blurb: "Seis sobres para calentar motores antes del pre-release.",
    contents: ["6 sobres sellados ME05", "Empaque exclusivo de bundle"],
    price: 34.99,
    img: `${K}/P11220-ME05_3D_Booster_Bundle_Left_EN-1453x2131-552324f.png?v=1777561069&width=800`,
    fallback: `${GEN}/0280dd7c-accc-4ed6-a74a-89bd7bde23ec/_result.png`,
    stock: 14,
  },
  {
    id: "pb-bb-kit",
    name: "Build & Battle Kit",
    blurb: "El kit de combate para llegar afilado al pre-release.",
    contents: ["4 sobres + carta promo foil", "Mazo temático de la expansión"],
    price: 27.99,
    img: `${K}/P11220-ME05_3D_Build_and_Battle_Outer_Sleeve_Left_EN-1548x2081-f33a365.png?v=1777561529&width=800`,
    fallback: `${GEN}/fdc7a93b-1995-4a7a-a531-2ce762a08e2a/_result.png`,
    stock: 12,
    tag: "Pre-release",
  },
  {
    id: "pb-blister",
    name: "3-Pack Blister",
    blurb: "Tres sobres y una promo para llevar a los torneos semanales.",
    contents: ["3 sobres sellados ME05", "Carta promo + blister coleccionable"],
    price: 18.99,
    img: `${K}/P11220-3D_ME05_3pk_Blister_Front_EN-2292x2104-5eeab1b.png?v=1777562097&width=800`,
    fallback: `${GEN}/a2b885f0-bc84-44e9-b295-5bac8d6d8bcb/_result.png`,
    stock: 16,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/* ---------- Datos de pago (transferencia / QR) ---------- */

export const PAYMENT = {
  bank: "Banco Pichincha",
  accountType: "Cuenta de Ahorros",
  account: "2100 458 731",
  holder: "FUN HOUSE TCG CIA. LTDA.",
  ruc: "1792-445667-001",
  email: "pagos@funhousetcg.ec",
  whatsapp: "099 555 2030",
};

export const payQrPayload = (code: string, total: number) =>
  `FUNHOUSE-PAY|${code}|USD ${total.toFixed(2)}|${PAYMENT.bank.toUpperCase()} AHORROS ${PAYMENT.account.replace(/\s/g, "")}|${PAYMENT.holder}`;

/* ---------- Helpers ---------- */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const uid = (p = "id") =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const shortCode = (prefix: string, len = 4) =>
  `${prefix}-${Array.from({ length: len }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("")}`;

export const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "justo ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} d`;
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-EC", { day: "2-digit", month: "short" });

export const daysAgo = (days: number, hour = 15, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

/* ---------- Seed ---------- */

export const seedUsers = (): User[] => [
  {
    id: "u-admin",
    name: "Admin Habemus Juegos",
    email: "admin@funhouse.ec",
    pass: "admin1234",
    role: "admin",
    code: "FH-ADMIN",
    visits: 0,
    cardsCompleted: 0,
    rewards: [],
    createdAt: daysAgo(90),
    lastVisitAt: null,
    hue: 42,
  },
  {
    id: "u-demo",
    name: "Daniela Proaño",
    email: "demo@jugador.ec",
    pass: "demo1234",
    role: "player",
    code: "FH-7K3D",
    visits: 7,
    cardsCompleted: 0,
    rewards: [],
    createdAt: daysAgo(34),
    lastVisitAt: daysAgo(2, 18),
    hue: 320,
  },
  {
    id: "u-mateo",
    name: "Mateo Ycaza",
    email: "mateo@correo.ec",
    pass: "mateo123",
    role: "player",
    code: "FH-M4T2",
    visits: 12,
    cardsCompleted: 1,
    rewards: [
      {
        id: "r-mateo-1",
        level: 1,
        title: "Sobre Pitch Black",
        code: "PRM-4821",
        requestedAt: daysAgo(9),
        deliveredAt: daysAgo(8),
      },
    ],
    createdAt: daysAgo(60),
    lastVisitAt: daysAgo(1, 17),
    hue: 200,
  },
  {
    id: "u-sofia",
    name: "Sofía Andrade",
    email: "sofia@correo.ec",
    pass: "sofia123",
    role: "player",
    code: "FH-S0F1",
    visits: 23,
    cardsCompleted: 1,
    rewards: [
      {
        id: "r-sofia-1",
        level: 1,
        title: "Sobre Pitch Black",
        code: "PRM-1177",
        requestedAt: daysAgo(21),
        deliveredAt: daysAgo(20),
      },
      {
        id: "r-sofia-2",
        level: 2,
        title: "Promo Habemus Juegos",
        code: "PRM-2214",
        requestedAt: daysAgo(1, 19),
        deliveredAt: null,
      },
    ],
    createdAt: daysAgo(80),
    lastVisitAt: daysAgo(1, 19),
    hue: 150,
  },
  {
    id: "u-juan",
    name: "Juan Pablo Ruiz",
    email: "juan@correo.ec",
    pass: "juan1234",
    role: "player",
    code: "FH-JP91",
    visits: 9,
    cardsCompleted: 0,
    rewards: [],
    createdAt: daysAgo(12),
    lastVisitAt: daysAgo(3, 16),
    hue: 20,
  },
  {
    id: "u-valen",
    name: "Valentina Mena",
    email: "vale@correo.ec",
    pass: "vale1234",
    role: "player",
    code: "FH-VL33",
    visits: 31,
    cardsCompleted: 3,
    rewards: [
      { id: "r-v1", level: 1, title: "Sobre Pitch Black", code: "PRM-9012", requestedAt: daysAgo(40), deliveredAt: daysAgo(39) },
      { id: "r-v2", level: 2, title: "Promo Habemus Juegos", code: "PRM-9130", requestedAt: daysAgo(25), deliveredAt: daysAgo(24) },
      { id: "r-v3", level: 3, title: "$5 de descuento", code: "PRM-9355", requestedAt: daysAgo(6), deliveredAt: daysAgo(5) },
    ],
    createdAt: daysAgo(85),
    lastVisitAt: daysAgo(0, 12),
    hue: 265,
  },
  {
    id: "u-andres",
    name: "Andrés Cevallos",
    email: "andres@correo.ec",
    pass: "andres12",
    role: "player",
    code: "FH-AN07",
    visits: 4,
    cardsCompleted: 0,
    rewards: [],
    createdAt: daysAgo(8),
    lastVisitAt: daysAgo(4, 15),
    hue: 95,
  },
  {
    id: "u-cami",
    name: "Camila Torres",
    email: "cami@correo.ec",
    pass: "cami1234",
    role: "player",
    code: "FH-CM88",
    visits: 17,
    cardsCompleted: 1,
    rewards: [
      { id: "r-c1", level: 1, title: "Sobre Pitch Black", code: "PRM-6640", requestedAt: daysAgo(15), deliveredAt: daysAgo(14) },
    ],
    createdAt: daysAgo(50),
    lastVisitAt: daysAgo(2, 19),
    hue: 15,
  },
  {
    id: "u-nico",
    name: "Nicolás Vega",
    email: "nico@correo.ec",
    pass: "nico1234",
    role: "player",
    code: "FH-NV21",
    visits: 10,
    cardsCompleted: 0,
    rewards: [],
    createdAt: daysAgo(28),
    lastVisitAt: daysAgo(0, 11),
    hue: 185,
  },
];

export const seedVisitLog = (): VisitEntry[] => {
  const picks: Array<[number, string]> = [
    [0, "u-valen"], [0, "u-nico"], [0, "u-demo"],
    [1, "u-mateo"], [1, "u-sofia"], [1, "u-juan"], [1, "u-cami"],
    [2, "u-demo"], [2, "u-cami"], [2, "u-valen"],
    [3, "u-juan"], [3, "u-mateo"], [3, "u-sofia"], [3, "u-andres"], [3, "u-nico"],
    [4, "u-valen"], [4, "u-demo"],
    [5, "u-sofia"], [5, "u-mateo"], [5, "u-cami"], [5, "u-juan"],
    [6, "u-andres"], [6, "u-nico"], [6, "u-valen"],
  ];
  const hours = [11, 12, 15, 16, 17, 18, 19, 13, 14, 20];
  return picks.map(([d, userId], i) => ({
    id: `v-seed-${i}`,
    userId,
    at: daysAgo(d, hours[i % hours.length], (i * 7) % 60),
  }));
};

export const seedReservations = (): Reservation[] => [
  {
    id: "res-demo-1",
    code: "PB-K7D2",
    userId: "u-demo",
    productId: "pb-etb",
    qty: 1,
    total: 64.99,
    status: "pago_por_verificar",
    createdAt: daysAgo(1, 18),
    paidAt: daysAgo(1, 18),
  },
  {
    id: "res-mateo-1",
    code: "PB-M4T9",
    userId: "u-mateo",
    productId: "pb-display",
    qty: 1,
    total: 179.99,
    status: "pago_confirmado",
    createdAt: daysAgo(4, 16),
    paidAt: daysAgo(4, 17),
  },
  {
    id: "res-valen-1",
    code: "PB-VL15",
    userId: "u-valen",
    productId: "pb-blister",
    qty: 2,
    total: 37.98,
    status: "listo_retiro",
    createdAt: daysAgo(12, 15),
    paidAt: daysAgo(12, 16),
  },
];
