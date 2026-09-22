import { useRef, type KeyboardEvent } from "react";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { SELECTED_CARD_CLASS, SelectedCardEdge } from "@/components/SelectedCard";
import { MaskColorPicker } from "@/components/sleep-mask/MaskColorPicker";
import { MASK_SWATCH_OPTIONS } from "@/components/sleep-mask/mask-swatches";
import { resolveSelectableMaskColor, type MaskColorId } from "@/lib/mask-colors";
import { SLEEP_MASK_PACKS, sleepMaskPack, sleepMaskPackSavings } from "@/lib/order";
import { cn } from "@/lib/utils";

const gs = (amount: number) => `${amount.toLocaleString("es-PY")} Gs`;

const packLabel = (quantity: number) => (quantity === 1 ? "1 antifaz" : `${quantity} antifaces`);

/**
 * La linea de abajo de las tarjetas: precio por unidad y ahorro del pack
 * elegido. Con uno solo empuja al pack de dos con el ahorro real, sin inventar
 * nada que la tabla no diga.
 */
const packDetail = (quantity: number): string => {
  const pack = sleepMaskPack(quantity);
  if (pack.quantity === 1) return `Llevando 2 ahorrás ${gs(sleepMaskPackSavings(sleepMaskPack(2)))}.`;
  return `${gs(pack.price / pack.quantity)} cada uno. Ahorrás ${gs(sleepMaskPackSavings(pack))}.`;
};

interface MaskPackPickerProps {
  /** Color de cada antifaz, uno por unidad. El largo es la cantidad. */
  picks: readonly MaskColorId[];
  onQuantityChange: (quantity: number) => void;
  onPickChange: (index: number, color: MaskColorId) => void;
  /**
   * Anuncia el precio por unidad y el ahorro al cambiar de pack. Solo una
   * instancia de la pagina: el selector esta en el hero y en el cierre, y dos
   * regiones vivas leerian lo mismo dos veces.
   */
  announce?: boolean;
  /** El cliente se acerca a las muestras de color: momento de precargar el otro color. */
  onColorIntent?: () => void;
  className?: string;
}

/**
 * Cantidad y color por unidad, la misma mecanica que los packs de lentes: el
 * pack se elige arriba con su precio total y cada antifaz tiene su color, con
 * mezcla permitida y el agotado manual respetado por unidad.
 *
 * Las tarjetas son un radiogroup con foco itinerante: Tab entra al elegido y
 * las flechas cambian de pack, como en el selector de color.
 */
export const MaskPackPicker = ({ picks, onQuantityChange, onPickChange, announce = false, onColorIntent, className }: MaskPackPickerProps) => {
  const quantity = picks.length;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = SLEEP_MASK_PACKS.length;
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % count,
      ArrowDown: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      ArrowUp: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onQuantityChange(SLEEP_MASK_PACKS[next].quantity);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="radiogroup" aria-label="Cantidad de antifaces" className="grid grid-cols-3 gap-2">
        {SLEEP_MASK_PACKS.map((pack, index) => {
          const selected = pack.quantity === quantity;
          return (
            <button
              key={pack.quantity}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${packLabel(pack.quantity)}, ${gs(pack.price)}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onQuantityChange(pack.quantity)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                // Mismo estado elegido que los packs de lentes (SelectedCard):
                // el filete se dibuja contra el boton, asi que va relative y
                // recorta en su radio.
                "relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                selected
                  ? SELECTED_CARD_CLASS
                  : "border-white/15 bg-transparent [@media(hover:hover)]:hover:border-white/35",
              )}
            >
              {selected && <SelectedCardEdge />}
              <span className={cn("relative block text-[13px]", selected ? "text-white" : "text-white/65")}>
                {packLabel(pack.quantity)}
              </span>
              <span className="relative mt-0.5 block whitespace-nowrap text-[17px] font-bold leading-tight tracking-[-0.01em] text-white tabular-nums">
                {pack.price.toLocaleString("es-PY")}
                <span className="ml-0.5 text-[12px] font-medium tracking-normal text-white/60">Gs</span>
              </span>
            </button>
          );
        })}
      </div>

      <p aria-live={announce ? "polite" : undefined} className="mt-2 text-[13px] text-white/65">
        {packDetail(quantity)}
      </p>

      {/* Hover, foco o toque sobre las muestras: la foto del otro color empieza a
          bajar antes del click, y el cruce no espera la red. */}
      <div className="mt-3" onPointerEnter={onColorIntent} onFocusCapture={onColorIntent}>
        {quantity === 1 ? (
          <MaskColorPicker value={resolveSelectableMaskColor(picks[0])} onChange={(next) => onPickChange(0, next)} />
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span aria-hidden="true" className="text-[13px] text-white/60">Colores</span>
            <ul aria-label="Color de cada antifaz" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {picks.map((pick, index) => (
                <li key={index} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-3 text-[13px] font-semibold tabular-nums text-white/60">
                    {index + 1}
                  </span>
                  <ColorSwatchPicker
                    options={MASK_SWATCH_OPTIONS}
                    value={resolveSelectableMaskColor(pick)}
                    onChange={(next) => onPickChange(index, next)}
                    size="sm"
                    label={`Color del antifaz ${index + 1}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
