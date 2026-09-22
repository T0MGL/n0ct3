import { StarIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Lo que se lee al lado de las estrellas. Solo numeros que se puedan sostener. */
  label: string;
  /**
   * Segunda linea, mas chica y apagada: contexto, nunca otra calificacion.
   * Aparece desde sm, porque en la primera pantalla de un telefono chico
   * (375x667) empuja el boton del hero abajo del pliegue.
   */
  note?: string;
  /**
   * Porcion llena de la quinta estrella, 0 a 1. 1 son cinco llenas. El fondo de
   * la parcial va con un blanco al 20% y no con text-muted-foreground, que es
   * blanco pleno a proposito en todo el sitio: aca el atenuado ES el dato.
   */
  partial?: number;
  className?: string;
}

/**
 * Las estrellas con su texto al lado. Nacio en el hero de la landing de
 * lentes; vive aca porque /sleep-mask y /clip-on muestran el mismo bloque en
 * el mismo lugar del hero, y tres copias del mismo marcado se desincronizan.
 */
export const StarRating = ({ label, note, partial = 1, className }: StarRatingProps) => {
  const filled = Math.min(1, Math.max(0, partial));
  const full = filled >= 1 ? 5 : 4;
  const text = <p className="text-sm text-foreground font-medium">{label}</p>;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }, (_, index) => (
          <StarIcon key={index} className="w-5 h-5 star-gold" />
        ))}
        {full < 5 && (
          <div className="relative w-5 h-5">
            <StarIcon className="w-5 h-5 text-white/20 absolute" />
            <div className="overflow-hidden absolute inset-0" style={{ width: `${filled * 100}%` }}>
              <StarIcon className="w-5 h-5 star-gold" />
            </div>
          </div>
        )}
      </div>
      {/* Sin segunda linea el texto va suelto, tal como lo tenia el hero de
          lentes: envolverlo igual le cambiaria el DOM sin necesidad. */}
      {note ? (
        <div>
          {text}
          <p className="hidden text-[13px] leading-snug text-white/60 sm:block">{note}</p>
        </div>
      ) : (
        text
      )}
    </div>
  );
};
