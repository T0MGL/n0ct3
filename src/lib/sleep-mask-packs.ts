// Sin imports a proposito: el build de /sleep-mask lee el precio desde
// vite.config.ts para el JSON-LD, y ahi no hay alias ni loaders de assets.

/**
 * Packs del antifaz comprado sin lentes ni clip-on, solo en la web (/sleep-mask).
 * El pack se cuenta sobre el total de antifaces del pedido, colores sumados: un
 * negro y un rosado son el pack de dos. Helena cobra lineal y no lee esto.
 * Espejo en nocte-backend/server.js (SLEEP_MASK_PACK_PRICE): si cambia un
 * precio, cambia en los dos lados o el backend rebota los pedidos en COD.
 */
export const SLEEP_MASK_PACKS = [
  { quantity: 1, price: 169000 },
  { quantity: 2, price: 269000 },
  { quantity: 3, price: 369000 },
] as const;

export type SleepMaskPack = (typeof SLEEP_MASK_PACKS)[number];

/** El antifaz de a uno. Es el precio de catalogo de Ordefy y la base del ahorro. */
export const SLEEP_MASK_SOLO_PRICE = SLEEP_MASK_PACKS[0].price;
