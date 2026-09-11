// El gancho del hero y la seccion del clip-on viven en bundles distintos: el
// hero va en el principal y la seccion en un chunk lazy. Los ids viven aca para
// que los dos los compartan sin que el hero arrastre el chunk de la seccion.
export const CLIP_ON_GALLERY_ID = "clip-on-galeria";
export const CLIP_ON_TITLE_ID = "clipon-title";

// Cuadros seguidos sin moverse para dar el scroll por asentado, reapuntadas
// maximas y techo de tiempo para no quedar mirando la pagina para siempre.
const STILL_FRAMES = 8;
const MAX_CORRECTIONS = 2;
const GIVE_UP_MS = 6000;
// Si el scroll no arranca en este tiempo se evalua igual: puede que ya
// estuviera en destino, o que el salto instantaneo ya haya ocurrido.
const START_GRACE_MS = 600;
// Cuanto esperar a que monte la seccion si el toque llega antes que el chunk.
const MOUNT_WAIT_MS = 3000;
const TOLERANCE_PX = 8;

// Cada toque arranca una corrida y deja sin efecto la anterior: dos loops
// apuntando a la vez se pelearian entre ellos.
let activeRun = 0;

/**
 * El scroll cruza unas diez pantallas y en el viaje terminan de cargar cosas
 * de las secciones de arriba que no reservan su alto: la pagina crece y el
 * destino calculado al arrancar queda corto. Medido en mobile: la galeria
 * aterrizaba 220px mas abajo, con el CTA de lentes de la seccion anterior a la
 * vista. Y en iOS, sin scroll anchoring, una imagen que carga despues de
 * aterrizar la vuelve a correr.
 *
 * Por eso se reapunta cuando el scroll se asienta, pero solo si se movio la
 * pagina y nunca si se movio el viewport. Si el viewport no esta donde lo
 * mandamos, ni donde lo habria dejado el scroll anchoring, lo movio el
 * cliente, haya o no disparado un evento: un swipe de VoiceOver o buscar en la
 * pagina bajan sin wheel ni touch. Ahi se abandona.
 */
function settleOnTarget(target: HTMLElement, behavior: ScrollBehavior, run: number) {
  const startedAt = performance.now();
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const docTop = () => target.getBoundingClientRect().top + window.scrollY;
  const landingFor = (top: number) =>
    Math.min(top - margin, document.documentElement.scrollHeight - window.innerHeight);

  let aimedAt = docTop();
  let aimStartedAt = startedAt;
  let corrections = MAX_CORRECTIONS;
  let lastY = window.scrollY;
  let stillFrames = 0;
  let hasMoved = false;

  const tick = () => {
    const now = performance.now();
    if (run !== activeRun || now - startedAt > GIVE_UP_MS) return;

    const y = window.scrollY;
    if (y !== lastY) hasMoved = true;
    stillFrames = y === lastY ? stillFrames + 1 : 0;
    lastY = y;

    // Antes de que un scroll arranque, quieto no quiere decir asentado: sin
    // esta guarda, un hilo ocupado justo despues del toque se leia como que el
    // cliente habia movido el viewport y el loop abandonaba sin corregir. La
    // gracia se cuenta desde cada apuntada, no desde el toque, para que cubra
    // tambien las reapuntadas.
    const canJudge = hasMoved || now - aimStartedAt > START_GRACE_MS;

    if (canJudge && stillFrames >= STILL_FRAMES) {
      const top = docTop();
      const drift = top - aimedAt;
      const landing = landingFor(aimedAt);
      const whereWeLeftIt = Math.abs(y - landing) <= TOLERANCE_PX;
      const whereAnchoringLeftIt = Math.abs(y - landing - drift) <= TOLERANCE_PX;
      if (!whereWeLeftIt && !whereAnchoringLeftIt) return;

      if (Math.abs(target.getBoundingClientRect().top - margin) > TOLERANCE_PX) {
        if (corrections === 0) return;
        corrections -= 1;
        stillFrames = 0;
        hasMoved = false;
        aimedAt = top;
        aimStartedAt = now;
        target.scrollIntoView({ behavior, block: "start" });
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function whenMounted(id: string, run: number, onFound: (element: HTMLElement) => void) {
  const startedAt = performance.now();
  const startY = window.scrollY;
  const tick = () => {
    if (run !== activeRun) return;
    // Mientras se espera no scrolleamos nosotros, asi que cualquier movimiento
    // es del cliente: con el toque aparentemente muerto se puso a bajar solo,
    // y tirarlo a la galeria cuando monte la seccion seria robarle el scroll.
    if (Math.abs(window.scrollY - startY) > TOLERANCE_PX) return;
    const element = document.getElementById(id);
    if (element) {
      onFound(element);
      return;
    }
    if (performance.now() - startedAt < MOUNT_WAIT_MS) requestAnimationFrame(tick);
  };
  tick();
}

/**
 * Baja hasta la galeria del clip-on. Si el toque llega antes de que monte la
 * seccion (chunk lazy en una conexion lenta) espera hasta MOUNT_WAIT_MS en vez
 * de perder el toque.
 *
 * Con reduced motion va "instant" y no "auto": "auto" delega en el
 * scroll-behavior del CSS, y si algun dia alguien le pone scroll suave al
 * html, el salto directo dejaria de serlo sin que nadie lo note.
 */
export function scrollToClipOnGallery(reduceMotion: boolean): void {
  const run = ++activeRun;
  const behavior: ScrollBehavior = reduceMotion ? "instant" : "smooth";

  whenMounted(CLIP_ON_GALLERY_ID, run, (target) => {
    target.scrollIntoView({ behavior, block: "start" });
    // El foco va al titulo de la seccion. Sin esto quedaba en el gancho del
    // hero y el Tab siguiente, o VoiceOver, devolvia al cliente arriba.
    document.getElementById(CLIP_ON_TITLE_ID)?.focus({ preventScroll: true });
    settleOnTarget(target, behavior, run);
  });
}
