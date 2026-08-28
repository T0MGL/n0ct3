interface NocteMarkProps {
  className?: string;
  /** Texto accesible. null lo deja decorativo, para cuando el nombre ya esta al lado. */
  title?: string | null;
}

/**
 * Wordmark NOCTE. Sin ®.
 *
 * Geometria: caja 1050x226, trazo 37. La cap height es 3..221; la O y la C
 * sobresalen arriba y abajo, que es la compensacion optica de una curva contra
 * un trazo recto. La E son tres barras sin asta, a espaciado regular.
 *
 * El preloader de index.html lleva una copia inline de estas mismas rutas: tiene
 * que pintar antes de que baje el bundle, asi que no puede importar de aca. Si
 * se toca una, se toca la otra.
 */
export const NocteMark = ({ className, title = "NOCTE" }: NocteMarkProps) => (
  <svg
    viewBox="0 0 1050 226"
    className={className}
    fill="currentColor"
    role={title ? "img" : undefined}
    aria-label={title ?? undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    <rect x="0" y="3" width="37" height="218" />
    <rect x="160" y="3" width="37" height="218" />
    <polygon points="0,3 41,3 197,221 156,221" />
    <ellipse cx="344" cy="113" rx="93" ry="96" fill="none" stroke="currentColor" strokeWidth="37" />
    <path d="M664.4 58.5 A 92 95 0 1 0 664.4 167.5" fill="none" stroke="currentColor" strokeWidth="37" />
    <rect x="695" y="3" width="173" height="35" />
    <rect x="763.5" y="3" width="37" height="218" />
    <rect x="896" y="3" width="154" height="35" />
    <rect x="896" y="94.5" width="154" height="35" />
    <rect x="896" y="186" width="154" height="35" />
  </svg>
);

export default NocteMark;
