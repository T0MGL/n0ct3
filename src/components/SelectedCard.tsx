/**
 * El estado elegido de una tarjeta seleccionable, el mismo en toda la tienda:
 * borde del color activo, fondo apenas tenido, la barra de 3px a la izquierda
 * y el filete que recorre el borde (.laser-border, en index.css).
 *
 * Nacio en los packs de lentes (BundleSelector) y ahora lo usan tambien los
 * packs del antifaz. Vive aca porque cuando se toca, se toca para las dos: dos
 * selectores con el mismo rol y distinto estado elegido se leen como dos
 * tiendas distintas, que es justo lo que se pidio arreglar.
 *
 * La tarjeta tiene que ser `relative` y `overflow-hidden`: las dos piezas se
 * posicionan contra ella y siguen su radio.
 */

export const SELECTED_CARD_CLASS =
  "border-variant-active bg-[hsl(var(--variant-active)/0.025)] shadow-[0_8px_22px_-16px_hsl(var(--variant-active)/0.35)]";

export const SelectedCardEdge = () => (
  <>
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px] bg-variant-active"
    />
    <span aria-hidden="true" className="laser-border z-10" />
  </>
);
