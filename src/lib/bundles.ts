export interface Bundle {
  id: string;
  quantity: number;
  price: number;
  unitPrice: number;
  label: string;
  badge: string | null;
  highlighted: boolean;
  savings?: number;
}

export const BUNDLES: readonly Bundle[] = [
  {
    id: 'personal',
    quantity: 1,
    price: 249000,
    unitPrice: 249000,
    label: "Personal",
    badge: null,
    highlighted: false,
  },
  {
    id: 'pareja',
    quantity: 2,
    price: 389000,
    unitPrice: 194500,
    label: "Pack Pareja",
    badge: "MÁS VENDIDO",
    highlighted: true,
    savings: 109000,
  },
  {
    id: 'oficina',
    quantity: 3,
    price: 549000,
    unitPrice: 183000,
    label: "Pack Oficina",
    badge: "Super Ahorro",
    highlighted: false,
    savings: 198000,
  },
];

export const DEFAULT_BUNDLE_INDEX = 0; // Personal (249.000 Gs, base pack)
export const ORIGINAL_UNIT_PRICE = 290000; // Crossed-out reference price per unit
