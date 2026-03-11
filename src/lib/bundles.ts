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
    price: 229000,
    unitPrice: 229000,
    label: "Personal",
    badge: null,
    highlighted: false,
  },
  {
    id: 'pareja',
    quantity: 2,
    price: 349000,
    unitPrice: 174500,
    label: "Pack Pareja",
    badge: "MAS VENDIDO",
    highlighted: true,
    savings: 109000,
  },
  {
    id: 'oficina',
    quantity: 3,
    price: 489000,
    unitPrice: 163000,
    label: "Pack Oficina",
    badge: "Super Ahorro",
    highlighted: false,
    savings: 198000,
  },
];

export const DEFAULT_BUNDLE_INDEX = 0; // Personal (least price shock)
export const ORIGINAL_UNIT_PRICE = 279000; // Crossed-out reference price per unit
