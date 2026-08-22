/**
 * Fuente de datos de /cert.
 *
 * Es la unica fuente de verdad de los reportes de laboratorio y NO importa nada
 * de src/lib/variants.ts a proposito. variants.ts es el copy de producto, esto
 * es lo que dice el papel. Los dos pueden divergir y tienen que poder hacerlo.
 *
 * ------------------------------------------------------------------------
 * CUANDO LLEGUEN LOS REPORTES DE BUREAU VERITAS
 *
 *  1. Guardar cada PDF en public/reportes/ pisando el archivo que ya esta.
 *     Los nombres no cambian nunca: nocte-rojo.pdf, nocte-naranja.pdf,
 *     nocte-amarillo.pdf.
 *  2. En el lente que corresponda, reemplazar el objeto `source` completo:
 *
 *       source: {
 *         stage: "accredited",
 *         lab: "Bureau Veritas",
 *         scheme: "ISO/IEC 17025",
 *         reportNumber: "<numero del reporte>",
 *         issuedOn: "2026-09-01",
 *       },
 *
 *     TypeScript exige los cinco campos, asi que no se puede dejar a medias.
 *  3. Actualizar `blueBandTransmittance`, `luminousTransmittance`, `spectrum`,
 *     `standards`, `failedItems` y `pdf` con lo que diga el reporte nuevo.
 *  4. Borrar de `caveats` lo que el reporte nuevo deje sin efecto.
 *  5. Actualizar `bytes` y `printedTitle` del PDF nuevo.
 *  6. Subir `PAGE_UPDATED_ON`.
 *
 * Se cambia solo este archivo. Nada de rutas, nada de componentes.
 * Los lentes son independientes: uno puede estar acreditado y los otros no.
 * ------------------------------------------------------------------------
 */

export type LensId = "rojo" | "naranja" | "amarillo";

export type StandardOutcome = "PASS" | "FAIL";

export interface StandardResult {
  readonly name: string;
  readonly outcome: StandardOutcome;
}

export interface SpectralPoint {
  readonly nm: number;
  readonly transmittance: number;
}

/** Medicion del propio fabricante del lente. No es laboratorio acreditado. */
interface ManufacturerSource {
  readonly stage: "manufacturer";
  readonly instrument: string;
  /** null cuando el documento no trae fecha. El del amarillo no la trae. */
  readonly measuredOn: string | null;
}

/** Ensayo de un laboratorio acreditado. */
interface AccreditedSource {
  readonly stage: "accredited";
  readonly lab: string;
  readonly scheme: string;
  readonly reportNumber: string;
  readonly issuedOn: string;
}

export type ReportSource = ManufacturerSource | AccreditedSource;

export interface ReportPdf {
  readonly href: string;
  readonly downloadAs: string;
  readonly bytes: number;
  /** Titulo literal impreso en el papel. La pagina no lo repite como propio. */
  readonly printedTitle: string;
}

export interface Caveat {
  readonly title: string;
  readonly body: string;
}

export interface LensReport {
  readonly id: LensId;
  readonly name: string;
  readonly model: string;
  readonly lensCode: string | null;
  readonly source: ReportSource;
  /** Tsb 380 a 500 nm, impreso en el reporte. */
  readonly blueBandTransmittance: number;
  /** Tv, impreso en el reporte. */
  readonly luminousTransmittance: number;
  /** Tabla espectral del reporte, cada 10 nm. */
  readonly spectrum: readonly SpectralPoint[];
  /** Longitudes de onda con lectura invalida, se excluyen de todo calculo. */
  readonly invalidNm: readonly number[];
  readonly standards: readonly StandardResult[];
  readonly failedItems: readonly string[];
  readonly caveats: readonly Caveat[];
  readonly pdf: ReportPdf;
}

/** Banda de luz azul que evalua el Tsb impreso. */
export const BLUE_BAND = { from: 380, to: 500 } as const;

/** Banda del promedio que calculamos nosotros a partir de la tabla espectral. */
export const AVERAGE_BAND = { from: 400, to: 550 } as const;

export const PAGE_UPDATED_ON = "2026-08-22";

type RawSpectrum = readonly (readonly [nm: number, transmittance: number])[];

const ROJO_SPECTRUM: RawSpectrum = [
  [280, 0.03], [290, 0.02], [300, 0.02], [310, 0.02], [320, 0.02], [330, 0.01],
  [340, 0.02], [350, 0.02], [360, 0.01], [370, 0.02], [380, 0.02], [390, 0.04],
  [400, 0.04], [410, 0.86], [420, 2.17], [430, 1.50], [440, 0.68], [450, 0.34],
  [460, 0.20], [470, 0.15], [480, 0.08], [490, 0.09], [500, 0.12], [510, 0.10],
  [520, 0.13], [530, 0.18], [540, 0.45], [550, 1.26], [560, 3.62], [570, 10.16],
  [580, 23.68], [590, 42.54], [600, 61.30], [610, 74.86], [620, 83.05],
  [630, 87.05], [640, 89.57], [650, 90.90], [660, 91.89], [670, 92.35],
  [680, 92.70], [690, 92.82], [700, 93.03], [710, 92.92], [720, 92.48],
  [730, 93.07], [740, 92.96], [750, 93.27], [760, 93.08], [770, 93.24],
  [780, 93.42],
];

const NARANJA_SPECTRUM: RawSpectrum = [
  [280, 0.03], [290, 0.02], [300, 0.02], [310, 0.02], [320, 0.02], [330, 0.01],
  [340, 0.02], [350, 0.02], [360, 0.01], [370, 0.02], [380, 0.02], [390, 0.05],
  [400, 0.04], [410, 0.26], [420, 0.21], [430, 0.22], [440, 0.16], [450, 0.09],
  [460, 0.35], [470, 1.03], [480, 1.23], [490, 1.83], [500, 2.95], [510, 3.78],
  [520, 5.32], [530, 9.30], [540, 17.32], [550, 27.35], [560, 39.00],
  [570, 51.93], [580, 65.25], [590, 76.92], [600, 83.86], [610, 88.12],
  [620, 90.82], [630, 92.77], [640, 93.97], [650, 94.27], [660, 94.21],
  [670, 94.77], [680, 94.82], [690, 96.04], [700, 96.02], [710, 95.42],
  [720, 95.19], [730, 94.71], [740, 94.78], [750, 94.66], [760, 94.94],
  [770, 95.93], [780, 95.14],
];

// El 370 nm marca 100,000 % entre dos puntos de 0,000 % y 1,230 %. Es la
// lectura fallada que la pagina declara. Se grafica igual, sin recortar.
const AMARILLO_SPECTRUM: RawSpectrum = [
  [280, 0.00], [290, 0.00], [300, 0.00], [310, 0.00], [320, 0.00], [330, 0.00],
  [340, 0.00], [350, 0.00], [360, 0.00], [370, 100.00], [380, 1.23], [390, 0.00],
  [400, 0.00], [410, 0.89], [420, 3.48], [430, 4.74], [440, 3.75], [450, 2.14],
  [460, 11.27], [470, 25.45], [480, 30.93], [490, 38.73], [500, 46.18],
  [510, 52.66], [520, 59.12], [530, 67.78], [540, 79.90], [550, 87.16],
  [560, 88.34], [570, 89.53], [580, 91.03], [590, 90.77], [600, 90.49],
  [610, 91.39], [620, 92.45], [630, 92.32], [640, 91.84], [650, 92.72],
  [660, 93.84], [670, 94.66], [680, 94.67], [690, 94.02], [700, 94.18],
  [710, 94.91], [720, 95.53], [730, 94.40], [740, 94.32], [750, 96.40],
  [760, 95.95], [770, 96.34], [780, 97.11],
];

function toSpectrum(raw: RawSpectrum): readonly SpectralPoint[] {
  return raw.map(([nm, transmittance]) => ({ nm, transmittance }));
}

const DRIVING_ITEMS_ROJO: readonly string[] = [
  "Reconocimiento de la señal verde y de la azul, con luz incandescente y con LED (Q,Green y Q,Blue).",
  "Transmitancia mínima entre 475 y 650 nm (Tmin): pide 3,89 % y mide 0,07 %.",
  "Conducción en penumbra o de noche: pide una transmitancia luminosa de 75 % y mide 19,45 %.",
  "Distorsión de color bajo ANSI Z80.3, en verde y en D65.",
];

const DRIVING_ITEMS_NARANJA: readonly string[] = [
  "Reconocimiento de la señal azul, y de la verde en semáforos LED (Q,Blue y Q,Green).",
  "Transmitancia mínima entre 475 y 650 nm (Tmin): pide 7,89 % y mide 1,14 %.",
  "Conducción en penumbra o de noche: pide una transmitancia luminosa de 75 % y mide 39,46 %.",
  "Distorsión de color bajo ANSI Z80.3, en verde y en D65.",
];

const SUNGLASS_STANDARDS: readonly StandardResult[] = [
  { name: "EN ISO 12312-1:2022", outcome: "FAIL" },
  { name: "ANSI Z80.3:2018", outcome: "FAIL" },
  { name: "AS/NZS 1067.1:2016+A1:2021", outcome: "FAIL" },
];

const AMARILLO_CAVEAT: Caveat = {
  title: "Un dato inválido en este reporte",
  body:
    "La tabla espectral marca 100,000 % de transmitancia en 370 nm, entre dos puntos que miden 0,000 % en 360 nm y 1,230 % en 380 nm. " +
    "Un salto así es físicamente imposible: es una lectura fallada del instrumento en ese punto, y se ve como un pico vertical en la curva de arriba. " +
    "Cae en el ultravioleta, fuera de la banda de 380 a 500 nm, así que no toca ninguna de las cifras de luz azul de esta página. " +
    "Lo dejamos a la vista en lugar de recortar el reporte.",
};

const REPORTS: Readonly<Record<LensId, LensReport>> = {
  rojo: {
    id: "rojo",
    name: "Rojo",
    model: "19220",
    lensCode: "R2251",
    source: {
      stage: "manufacturer",
      instrument: "Micro-Light Optics",
      measuredOn: "2025-11-24",
    },
    blueBandTransmittance: 0.68,
    luminousTransmittance: 19.45,
    spectrum: toSpectrum(ROJO_SPECTRUM),
    invalidNm: [],
    standards: SUNGLASS_STANDARDS,
    failedItems: DRIVING_ITEMS_ROJO,
    caveats: [],
    pdf: {
      href: "/reportes/nocte-rojo.pdf",
      downloadAs: "NOCTE-rojo-reporte-transmitancia.pdf",
      bytes: 633864,
      printedTitle: "Lens Certification Report",
    },
  },
  naranja: {
    id: "naranja",
    name: "Naranja",
    model: "19220",
    lensCode: null,
    source: {
      stage: "manufacturer",
      instrument: "Micro-Light Optics",
      measuredOn: "2025-11-07",
    },
    blueBandTransmittance: 0.51,
    luminousTransmittance: 39.46,
    spectrum: toSpectrum(NARANJA_SPECTRUM),
    invalidNm: [],
    standards: SUNGLASS_STANDARDS,
    failedItems: DRIVING_ITEMS_NARANJA,
    caveats: [],
    pdf: {
      href: "/reportes/nocte-naranja.pdf",
      downloadAs: "NOCTE-naranja-reporte-transmitancia.pdf",
      bytes: 648315,
      printedTitle: "Lens Certification Report",
    },
  },
  amarillo: {
    id: "amarillo",
    name: "Amarillo",
    model: "19220",
    lensCode: null,
    source: {
      stage: "manufacturer",
      instrument: "Topcon SIGM TM-3",
      measuredOn: null,
    },
    blueBandTransmittance: 11.75,
    luminousTransmittance: 77.64,
    spectrum: toSpectrum(AMARILLO_SPECTRUM),
    invalidNm: [370],
    standards: [{ name: "BS EN ISO 12312-1:2013+A1:2015", outcome: "PASS" }],
    failedItems: [],
    caveats: [AMARILLO_CAVEAT],
    pdf: {
      href: "/reportes/nocte-amarillo.pdf",
      downloadAs: "NOCTE-amarillo-reporte-transmitancia.pdf",
      bytes: 2449841,
      printedTitle: "Lens Test Report",
    },
  },
};

export const LENS_IDS = ["rojo", "naranja", "amarillo"] as const satisfies readonly LensId[];

export const DEFAULT_LENS_ID: LensId = "rojo";

export function getReport(id: LensId): LensReport {
  return REPORTS[id];
}

export function isLensId(value: string): value is LensId {
  return (LENS_IDS as readonly string[]).includes(value);
}

/**
 * Cuanta luz azul frena el lente, derivado del Tsb impreso. No sale del papel:
 * es 100 menos el Tsb, y la pagina lo dice donde lo muestra.
 */
export function blockedFromTransmittance(transmittance: number): number {
  return 100 - transmittance;
}

/**
 * Bloqueo promedio en una banda: promedio aritmetico de los puntos de la tabla
 * espectral dentro del rango, restado de 100. Los puntos marcados como
 * invalidos quedan afuera. Es la unica cifra de la pagina que no esta impresa.
 */
export function averageBlocked(report: LensReport, from: number, to: number): number {
  const points = report.spectrum.filter(
    (point) =>
      point.nm >= from && point.nm <= to && !report.invalidNm.includes(point.nm),
  );
  if (points.length === 0) return 0;
  const mean = points.reduce((sum, point) => sum + point.transmittance, 0) / points.length;
  return 100 - mean;
}

/** Minimo y maximo de transmitancia dentro de una banda, para describir la curva. */
export function bandExtremes(
  report: LensReport,
  from: number,
  to: number,
): { readonly min: number; readonly max: number } {
  const values = report.spectrum
    .filter(
      (point) =>
        point.nm >= from && point.nm <= to && !report.invalidNm.includes(point.nm),
    )
    .map((point) => point.transmittance);
  if (values.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Primera longitud de onda valida donde el lente deja pasar mas de `threshold`. */
export function firstNmAbove(report: LensReport, threshold: number): number | null {
  const point = report.spectrum.find(
    (candidate) =>
      candidate.transmittance > threshold && !report.invalidNm.includes(candidate.nm),
  );
  return point ? point.nm : null;
}

export function hasFailingStandard(report: LensReport): boolean {
  return report.standards.some((standard) => standard.outcome === "FAIL");
}

const decimalFormatters = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, decimals: number): string {
  let formatter = decimalFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-PY", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    decimalFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

export function formatBytes(bytes: number): string {
  const megabytes = bytes / 1_000_000;
  if (megabytes >= 1) return `${formatNumber(megabytes, 1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${day} de ${months[month - 1]} de ${year}`;
}
