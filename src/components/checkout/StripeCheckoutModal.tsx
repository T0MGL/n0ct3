import { useState, useEffect, useRef, useCallback, useId, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon, CreditCardIcon, DevicePhoneMobileIcon, BanknotesIcon, CheckIcon, EnvelopeIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment, PaymentAmountError } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';
import { getFbc, getFbp, hashEmail, hashPhoneE164, hashExternalId, hashFirstName, hashLastName, hashCity, hashCountry } from '@/lib/meta-matching';
import { CheckoutProgressBar } from './CheckoutProgressBar';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';
import { buildWhatsAppUrl } from '@/lib/contact';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ColorSwatchPicker, type SwatchOption } from '@/components/ColorSwatchPicker';
import {
  ALL_MASK_COLORS_SOLD_OUT,
  DEFAULT_MASK_COLOR,
  MASK_COLORS,
  MASK_COLOR_IDS,
  MASK_SOLD_OUT_NOTICE,
  MAX_MASK_QUANTITY,
  isMaskColorSoldOut,
  resizeMaskPicks,
  resolveSelectableMaskColor,
  type MaskColorId,
} from '@/lib/mask-colors';
import { MASK_PHOTOS, MASK_PHOTO_SIZES } from '@/lib/mask-photos';
import { summarizeVariantCounts } from '@/lib/variants';
import {
  CLIP_ON,
  PRIORITY_SHIPPING,
  SLEEP_MASK,
  buildOrderLines,
  sumLines,
  type CheckoutItem,
  type OrderLine,
} from '@/lib/order';

type PaymentMethod = 'card' | 'cash_on_delivery';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_EMAIL = 'noreply@nocte.studio';

// The order summary must name the real lens colors. It used to hardcode
// "Lentes Rojos", so an order carrying the wrong color looked correct on
// screen and the customer had no way to catch it before paying.
function describeProduct(item: CheckoutItem): { title: string; breakdown: string | null } {
  if (item.product === 'clipon') {
    return { title: `NOCTE® ${CLIP_ON.name}`, breakdown: null };
  }

  const packSuffix = item.quantity > 1 ? ` - Pack x${item.quantity}` : '';
  const counts = summarizeVariantCounts(item.colors);

  if (counts.length === 0) {
    return { title: `Lentes Premium Anti-Luz Azul${packSuffix}`, breakdown: null };
  }
  if (counts.length === 1) {
    return { title: `${counts[0].variant.displayTitle}${packSuffix}`, breakdown: null };
  }

  return {
    title: `Lentes Premium Anti-Luz Azul${packSuffix}`,
    breakdown: counts
      .map(({ variant, count }) => `${count}x ${variant.id.charAt(0).toUpperCase()}${variant.id.slice(1)}`)
      .join(', '),
  };
}

interface UpsellRowProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description: string;
  price: number;
  /** Precio de catalogo, tachado arriba del real. Ausente cuando no hay descuento. */
  listPrice?: number;
  /** Foto a todo el ancho arriba de la tarjeta. Tocarla marca el bump. */
  media?: ReactNode;
  /** Lo que se despliega al marcarla, como la eleccion de color del antifaz. */
  children?: ReactNode;
}

// Misma curva y duracion que el despliegue de colores de los packs de lentes.
const EXPAND = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

/**
 * Una de las filas de upsell del resumen. El switch es un button con
 * role=switch, no un div con onClick como era antes: la fila anterior no se
 * podia tocar con teclado y un lector de pantalla no tenia como saber si estaba
 * marcada. La tarjeta es un div porque adentro puede ir un panel con controles
 * propios, y un button no puede contener otros.
 *
 * El precio va debajo del titulo y no al costado: en 390px la columna del
 * precio partia el titulo en tres renglones, y ese alto es el que ahora paga
 * la foto del antifaz.
 */
const UpsellRow = ({
  checked,
  onToggle,
  title,
  description,
  price,
  listPrice,
  media,
  children,
}: UpsellRowProps) => {
  const panelId = useId();
  const titleId = useId();
  const priceId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn(
        // El press se ve en toda la tarjeta aunque lo reciba el switch o la
        // foto: los dos llevan data-press y el switch no-press, para no
        // hundirse solo dentro de la tarjeta.
        'rounded-xl border transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out has-[>[data-press]:active]:scale-[0.99]',
        checked
          ? 'border-variant-active/40 bg-variant-active/5 shadow-[0_8px_24px_-16px_hsl(var(--variant-active)/0.5)]'
          : 'border-border/40 bg-secondary/30 hover:border-border/60 hover:bg-secondary/50',
      )}
    >
      {media && (
        // Solo marca, nunca desmarca: quien toca la foto de un bump ya
        // marcado la esta mirando, no arrepintiendose. Es un atajo para el
        // dedo; el control accesible es el switch de abajo.
        <div
          data-press={checked ? undefined : true}
          onClick={checked ? undefined : onToggle}
          className={cn('overflow-hidden rounded-t-[11px]', !checked && 'cursor-pointer')}
        >
          {media}
        </div>
      )}
      <button
        type="button"
        role="switch"
        data-press
        aria-checked={checked}
        aria-labelledby={titleId}
        aria-describedby={`${priceId} ${descriptionId}`}
        aria-controls={children && checked ? panelId : undefined}
        onClick={onToggle}
        className={cn(
          'no-press group relative w-full p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40',
          media ? 'rounded-b-xl' : 'rounded-xl',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 ease-out group-active:scale-90',
              checked
                ? 'border-variant-active bg-variant-active'
                : 'border-muted-foreground/40 group-hover:border-variant-active/50',
            )}
          >
            <CheckIcon
              className={cn(
                'h-3.5 w-3.5 text-white transition-[opacity,transform] duration-200 ease-out',
                checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
              strokeWidth={3}
            />
          </span>

          <div className="min-w-0 flex-1">
            {/* span y no p: dentro de un button solo va contenido en linea. */}
            <span
              id={titleId}
              className={cn('block text-sm font-bold leading-snug', checked ? 'text-variant-active' : 'text-foreground')}
            >
              {title}
            </span>
            <span id={priceId} className="mt-0.5 flex flex-wrap items-baseline gap-x-2 leading-tight">
              {listPrice !== undefined && (
                <span className="text-[11px] text-white/50 line-through">
                  {/* Sin esto el lector de pantalla dice "169.000 119.000" y el
                      tachado, que es puramente visual, no significa nada. */}
                  <span className="sr-only">Precio de lista, </span>
                  {formatPrice(listPrice, 'pyg')}
                </span>
              )}{' '}
              <span
                className={cn(
                  'whitespace-nowrap text-sm font-bold',
                  checked ? 'text-variant-active' : 'text-muted-foreground',
                )}
              >
                + {formatPrice(price, 'pyg')}
              </span>
            </span>
            <span id={descriptionId} className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {checked && children && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={reduceMotion ? { duration: 0 } : EXPAND}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Icono del envio prioritario, arriba de su tarjeta como la foto del antifaz
 * en la suya, asi el texto de las dos arranca en la misma columna. El archivo
 * trae fondo blanco opaco: la franja es blanca para que no se vea el borde.
 * alt vacio porque es decorativo; el titulo al lado ya dice que es.
 */
const ShippingIcon = ({ src, width, height }: { src: string; width: number; height: number }) => (
  <div className="flex h-16 items-center justify-center bg-white">
    <img src={src} alt="" width={width} height={height} decoding="async" className="h-[52px] w-auto" />
  </div>
);

// Los colores agotados no se bajan: nadie los puede elegir.
const MASK_PHOTO_COLORS = MASK_COLOR_IDS.filter((id) => !isMaskColorSoldOut(id));

interface MaskPhotoProps {
  color: MaskColorId;
  expanded: boolean;
}

/**
 * Foto del antifaz en uso. Sin marcar es una franja centrada en el antifaz;
 * al marcar crece hasta el recorte entero con la misma curva y duracion que el
 * panel de colores, asi foto y panel se abren como un solo movimiento. Los
 * colores estan apilados y cambian por opacidad: como es la misma escena, el
 * cruce solo cambia el antifaz.
 */
const MaskPhoto = ({ color, expanded }: MaskPhotoProps) => (
  <div
    className={cn(
      // duration-[] y ease-[] chocan con los de tailwindcss-animate y Tailwind no
      // los genera: van como propiedad. --ease-smooth es la curva de EXPAND.
      'relative bg-white/[0.04] transition-[padding-top] [transition-duration:320ms] [transition-timing-function:var(--ease-smooth)] motion-reduce:transition-none',
      // Sin marcar, una franja con el antifaz al centro. Marcado, casi todo el
      // recorte (700/1200 seria el 58%): con 52% la foto crece pero empuja el
      // boton de confirmar menos de lo que ya lo empuja el panel de colores.
      expanded ? 'pt-[52%]' : 'pt-[38%]',
    )}
  >
    {MASK_PHOTO_COLORS.map((id) => (
      <img
        key={id}
        src={MASK_PHOTOS[id].src}
        srcSet={MASK_PHOTOS[id].srcSet}
        sizes={MASK_PHOTO_SIZES}
        alt={MASK_PHOTOS[id].alt}
        aria-hidden={id === color ? undefined : true}
        loading="lazy"
        decoding="async"
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none',
          id === color ? 'opacity-100' : 'opacity-0',
        )}
      />
    ))}
  </div>
);

const MASK_OPTIONS: readonly SwatchOption<MaskColorId>[] = MASK_COLOR_IDS.map((id) => ({
  id,
  name: MASK_COLORS[id].name,
  soldOutLabel: `${MASK_COLORS[id].name} agotado`,
  swatch: MASK_COLORS[id].swatch,
  ring: MASK_COLORS[id].ring,
  needsOutline: MASK_COLORS[id].needsOutline,
  soldOut: MASK_COLORS[id].soldOut,
}));

// En el tope el boton sigue enfocable (aria-disabled) y el press global lo
// hundiria igual: no-press lo apaga solo mientras no hay nada que hacer.
const STEP_BUTTON =
  "relative grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white transition-[background-color,opacity] duration-200 after:absolute after:-inset-1.5 after:content-[''] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:bg-transparent";

interface MaskUnitsProps {
  picks: readonly MaskColorId[];
  onChange: (next: MaskColorId[]) => void;
  /** El color que se acaba de elegir en cualquier unidad: la foto lo sigue. */
  onColorPick: (color: MaskColorId) => void;
}

/**
 * Cantidad y color de cada antifaz. Mismo patron que el pack de lentes: una
 * fila por unidad, con su numero y el mismo selector de color, y el agotado
 * visible pero deshabilitado.
 */
const MaskUnits = ({ picks, onChange, onColorPick }: MaskUnitsProps) => {
  const quantity = picks.length;
  const atMin = quantity <= 1;
  const atMax = quantity >= MAX_MASK_QUANTITY;
  const setQuantity = (next: number) => {
    const clamped = Math.max(1, Math.min(MAX_MASK_QUANTITY, next));
    if (clamped !== quantity) onChange(resizeMaskPicks(picks, clamped));
  };
  const setPick = (index: number, color: MaskColorId) => {
    onChange(picks.map((pick, i) => (i === index ? color : pick)));
    onColorPick(color);
  };

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-white">Cantidad</p>
          <p className="whitespace-nowrap text-[11px] text-white/60">{formatPrice(SLEEP_MASK.price, 'pyg')} c/u</p>
        </div>
        {/* Los botones miden 32px pero tocan en 44: el after los agranda sin pisar
            el numero. En el tope van aria-disabled y no disabled: un boton
            disabled suelta el foco y el teclado cae detras del modal. */}
        <div role="group" aria-label="Cantidad de antifaces" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuantity(quantity - 1)}
            aria-disabled={atMin || undefined}
            aria-label="Quitar un antifaz"
            className={cn(STEP_BUTTON, atMin && 'no-press')}
          >
            <MinusIcon className="h-4 w-4" strokeWidth={2} />
          </button>
          <span aria-live="polite" className="w-7 text-center text-sm font-semibold tabular-nums text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            aria-disabled={atMax || undefined}
            aria-label="Agregar otro antifaz"
            className={cn(STEP_BUTTON, atMax && 'no-press')}
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white">
        {quantity === 1 ? 'Elegí el color' : 'Elegí el color de cada antifaz'}
      </p>
      {MASK_SOLD_OUT_NOTICE && (
        <p className="text-[11px] font-medium text-white">{MASK_SOLD_OUT_NOTICE}</p>
      )}
      <ul className="space-y-2">
        {picks.map((rawPick, index) => {
          const pick = resolveSelectableMaskColor(rawPick);
          return (
            <li
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {quantity > 1 && (
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[10px] font-bold text-white ring-1 ring-white/10"
                  >
                    {index + 1}
                  </span>
                )}
                <p className="text-[12px] font-medium leading-none text-white">{MASK_COLORS[pick].name}</p>
              </div>
              <ColorSwatchPicker
                options={MASK_OPTIONS}
                value={pick}
                onChange={(next) => setPick(index, next)}
                size="sm"
                label={quantity === 1 ? 'Color del antifaz' : `Color del antifaz ${index + 1}`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export interface PaymentResult {
  paymentIntentId: string;
  paymentType: 'Card' | 'COD';
  isPaid: boolean;
  deliveryType: 'común' | 'premium';
  /** El pedido desglosado. Lo que se manda a Ordefy sale de aca, sin restas. */
  lines: OrderLine[];
  /** sumLines(lines). Lo usan la pantalla de exito y el pixel. */
  finalTotal: number;
  email?: string;
}

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: (result: PaymentResult) => void;
  /** Que se esta comprando: pack de lentes o clip-on. Los upsells se eligen aca. */
  item: CheckoutItem;
  currency: string;
  isProcessingOrder?: boolean;
  customerData: {
    name: string;
    phone: string;
    location: string;
    address: string;
    isGeolocated?: boolean;
    orderNumber: string;
    email?: string;
  };
}

const CheckoutForm = ({
  onSuccess,
  onClose,
  item,
  currency,
  customerData,
  onCloseAttempt,
  syncPaymentIntentAmount,
}: Omit<StripeCheckoutModalProps, 'isOpen'> & {
  onCloseAttempt: () => void;
  /** Deja el PaymentIntent en el monto pedido. No-op si ya esta ahi. */
  syncPaymentIntentAmount: (amount: number) => Promise<void>;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [isPriorityShipping, setIsPriorityShipping] = useState(false);
  // Color de cada antifaz, uno por unidad. Vacio es sin antifaz.
  const [maskPicks, setMaskPicks] = useState<MaskColorId[]>([]);
  // La foto del antifaz muestra el ultimo color que se toco. Si ese color ya
  // no esta entre las unidades (se bajo la cantidad), muestra el de la ultima.
  const [pickedMaskColor, setPickedMaskColor] = useState<MaskColorId>(DEFAULT_MASK_COLOR);
  const maskPhotoColor = resolveSelectableMaskColor(
    maskPicks.length === 0 || maskPicks.includes(pickedMaskColor)
      ? pickedMaskColor
      : maskPicks[maskPicks.length - 1],
  );
  const toggleMask = () => {
    // Al marcar la primera unidad es el color por defecto y la foto la sigue;
    // al desmarcar vuelve al por defecto, que es lo que se ve sin marcar.
    setPickedMaskColor(DEFAULT_MASK_COLOR);
    setMaskPicks((prev) => (prev.length > 0 ? [] : [DEFAULT_MASK_COLOR]));
  };
  const [email, setEmail] = useState(customerData.email ?? '');
  const [emailError, setEmailError] = useState<string | null>(null);
  // Si en el paso de la factura ya dejo el correo, no se le vuelve a pedir:
  // se le muestra cual va a recibir el recibo y un enlace por si se equivoco.
  const [editingEmail, setEditingEmail] = useState(false);
  const emailFromInvoice = (customerData.email ?? '').trim();
  const showEmailInput = editingEmail || !emailFromInvoice;

  // Determine if delivery is free (Gran Asunción only)
  // El envio es gratis a todo Paraguay, sin importar el departamento. Antes
  // esto era isGranAsuncion(location) y al cliente del interior le aparecia
  // "A cargo del Courier" en la pantalla de pagar, despues de que el banner, el
  // FAQ, la tira de packs, la comparativa, el sello de garantia y los terminos
  // le prometieran envio gratis. Lo que cambia por zona es el plazo, no el
  // precio, y el plazo ya se comunica antes de llegar aca.

  const productSummary = describeProduct(item);

  // El pedido, linea por linea. El total es la suma de las lineas y nada mas:
  // agregar un upsell es empujar una linea, no acordarse de sumar un numero
  // aca y de restarlo en el backend.
  const orderLines = buildOrderLines(item, {
    sleepMaskPicks: maskPicks,
    priorityShipping: isPriorityShipping,
  });
  const finalTotal = sumLines(orderLines);

  const submitButtonRef = useRef<HTMLDivElement>(null);
  const paymentElementRef = useRef<HTMLDivElement>(null);

  // Reset element readiness when switching away from card so a re-mount re-triggers onReady
  useEffect(() => {
    if (paymentMethod === 'card') {
      setIsElementReady(false);
    }
  }, [paymentMethod]);

  // Prefill email from the factura upstream path if it arrives after mount
  useEffect(() => {
    if (customerData.email && !email) {
      setEmail(customerData.email);
    }
  }, [customerData.email, email]);

  // AddPaymentInfo is tracked at submit time only (not on render)
  // to avoid sending Meta signals for users who abandon checkout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);
    setErrorMessage(null);
    setEmailError(null);

    // Email is only required for card payments where Stripe needs a receipt
    // target. COD continues to be backward compatible and optional.
    const emailTrimmed = email.trim();
    if (paymentMethod === 'card') {
      if (!emailTrimmed) {
        // Si el correo venia del paso 1 el campo esta colapsado: hay que
        // abrirlo o el error queda sin donde corregirse.
        setEditingEmail(true);
        setEmailError('Email requerido para el recibo del pago');
        setIsProcessing(false);
        return;
      }
      if (!EMAIL_REGEX.test(emailTrimmed) || emailTrimmed.length > 120) {
        setEditingEmail(true);
        setEmailError('Email inválido');
        setIsProcessing(false);
        return;
      }
    }

    // Value used downstream: real typed email for card, typed or factura for COD,
    // undefined if the user chose COD and never typed anything.
    const emailForPipeline: string | undefined = emailTrimmed || customerData.email || undefined;

    try {
      // Handle Cash on Delivery
      if (paymentMethod === 'cash_on_delivery') {
        // Generate a COD order ID - Append PRIORITY tag if selected
        let codOrderId = `COD-${customerData.orderNumber}-${Date.now()}`;
        if (isPriorityShipping) {
          codOrderId += '-PRIORITY';
        }

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        void (async () => {
          try {
            const [em, ph, external_id, fn, ln, ct, country] = await Promise.all([
              hashEmail(emailForPipeline),
              hashPhoneE164(customerData.phone),
              hashExternalId(customerData.orderNumber),
              hashFirstName(customerData.name),
              hashLastName(customerData.name),
              hashCity(customerData.location),
              hashCountry(),
            ]);
            trackAddPaymentInfo({
              value: finalTotal,
              currency: currency.toUpperCase(),
              num_items: item.quantity,
              payment_type: 'Pago contra entrega',
              user_data: { em, ph, fn, ln, ct, country, external_id, fbc: getFbc(), fbp: getFbp() },
            });
          } catch {
            trackAddPaymentInfo({
              value: finalTotal,
              currency: currency.toUpperCase(),
              num_items: item.quantity,
              payment_type: 'Pago contra entrega',
            });
          }
        })();

        onSuccess({
          paymentIntentId: codOrderId,
          paymentType: 'COD',
          isPaid: false,
          deliveryType: isPriorityShipping ? 'premium' : 'común',
          lines: orderLines,
          finalTotal,
          email: emailForPipeline,
        });
        return;
      }

      // Handle Stripe payment (card, Apple Pay, Google Pay)
      if (!stripe || !elements) {
        setErrorMessage('Error al inicializar el sistema de pago');
        setIsProcessing(false);
        return;
      }

      if (!isElementReady) {
        setErrorMessage('El formulario de pago aún se está cargando. Intentá de nuevo en un momento.');
        setIsProcessing(false);
        return;
      }

      // El PaymentIntent se crea al abrir el modal, antes de que el cliente
      // elija los upsells, asi que su monto es el del producto solo. Sin este
      // ajuste la tarjeta cobra de menos exactamente lo que suman los upsells,
      // que es lo que venia pasando con el envio prioritario.
      //
      // Se sincroniza SIEMPRE, no solo cuando finalTotal difiere del precio del
      // producto: el intent sobrevive a un intento de pago fallido, asi que
      // quien marca el antifaz, se come un rechazo y despues lo destilda queda
      // con un intent en 368.000 y una pantalla que dice 249.000. Comparar
      // contra el producto no ve esa vuelta; el monto realmente sincronizado,
      // que es lo que guarda el padre, si. Si el ajuste falla se corta el pago:
      // cobrar distinto de lo que dice la pantalla es peor que pedir reintento.
      try {
        await syncPaymentIntentAmount(finalTotal);
      } catch (error) {
        // Un intent trabado no se destraba reintentando, hay que reiniciar el
        // pago. Decir "intentá de nuevo" ahi es mandarlo a un callejon.
        setErrorMessage(
          error instanceof PaymentAmountError && error.isTerminal
            ? 'Recargá la página para reiniciar el pago.'
            : 'No pudimos actualizar el monto del pago. Intentá de nuevo en un momento.',
        );
        setIsProcessing(false);
        return;
      }
      // Stripe recalcula los metodos de pago disponibles sobre el monto nuevo.
      // Sin fetchUpdates el Payment Element sigue mostrando el viejo.
      const { error: updateError } = await elements.fetchUpdates();
      if (updateError) {
        setErrorMessage('No pudimos actualizar el monto del pago. Intentá de nuevo en un momento.');
        setIsProcessing(false);
        return;
      }

      // Confirm payment using PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          receipt_email: emailTrimmed,
          payment_method_data: {
            billing_details: {
              name: customerData.name,
              phone: customerData.phone,
              email: emailTrimmed,
              address: {
                line1: customerData.address,
                city: customerData.location,
                postal_code: '0000',
                country: 'PY',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        void (async () => {
          try {
            const [em, ph, external_id, fn, ln, ct, country] = await Promise.all([
              hashEmail(emailTrimmed),
              hashPhoneE164(customerData.phone),
              hashExternalId(customerData.orderNumber),
              hashFirstName(customerData.name),
              hashLastName(customerData.name),
              hashCity(customerData.location),
              hashCountry(),
            ]);
            trackAddPaymentInfo({
              value: finalTotal,
              currency: currency.toUpperCase(),
              num_items: item.quantity,
              payment_type: 'Tarjeta',
              user_data: { em, ph, fn, ln, ct, country, external_id, fbc: getFbc(), fbp: getFbp() },
            });
          } catch {
            trackAddPaymentInfo({
              value: finalTotal,
              currency: currency.toUpperCase(),
              num_items: item.quantity,
              payment_type: 'Tarjeta',
            });
          }
        })();

        onSuccess({
          paymentIntentId: paymentIntent.id,
          paymentType: 'Card',
          isPaid: true,
          deliveryType: isPriorityShipping ? 'premium' : 'común',
          lines: orderLines,
          finalTotal,
          email: emailTrimmed,
        });
      } else {
        setErrorMessage(`Estado de pago inesperado: ${paymentIntent?.status}`);
        setIsProcessing(false);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Payment] Exception during payment:', error);
      }
      const message = error instanceof Error ? error.message : 'Error al procesar el pago';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Info Summary */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30 space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-3">
          Información de entrega
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Nombre:</span> {customerData.name}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Teléfono:</span> {customerData.phone}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Ciudad:</span> {customerData.location}
        </p>
        {!customerData.isGeolocated && customerData.address && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Dirección:</span> {customerData.address}
          </p>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-4">
          Método de pago
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Cash on Delivery Option - NOW FIRST */}
          <button
            type="button"
            onClick={() => setPaymentMethod('cash_on_delivery')}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-300
              ${paymentMethod === 'cash_on_delivery'
                ? 'border-variant-active bg-variant-active/10 shadow-lg'
                : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <BanknotesIcon className="w-6 h-6 text-variant-active" />
              <div>
                <p className={`text-sm font-semibold ${paymentMethod === 'cash_on_delivery' ? 'text-variant-active' : 'text-foreground'}`}>
                  Pagar al Recibir
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Efectivo / QR / Transferencia
                </p>
              </div>
            </div>
            {paymentMethod === 'cash_on_delivery' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-variant-active rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* Card / Digital Wallets Option - NOW SECOND */}
          <div className="relative rounded-lg">
            {paymentMethod !== 'card' && (
              <svg
                viewBox="0 0 100 78"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1" y="1"
                  width="98" height="76"
                  rx="5"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.55)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="12 400"
                  className="animate-border-travel"
                />
              </svg>
            )}
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`
                relative w-full p-4 rounded-lg transition-colors duration-300
                ${paymentMethod === 'card'
                  ? 'border-2 border-variant-active bg-variant-active/10 shadow-lg'
                  : 'border border-border/30 bg-secondary/30 hover:bg-secondary/50'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-variant-active" />
                  <DevicePhoneMobileIcon className="w-5 h-5 text-variant-active" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${paymentMethod === 'card' ? 'text-variant-active' : 'text-foreground'}`}>
                    Tarjeta de Crédito / Débito
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apple Pay, Google Pay
                  </p>
                </div>
              </div>
              {paymentMethod === 'card' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-variant-active rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Element - Only show for card payments */}
      {paymentMethod === 'card' && (
        <div ref={paymentElementRef} className="p-5 bg-secondary/20 rounded-lg border border-border/30 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2">
            Detalles de pago
          </h3>

          {/* Email del recibo. Si ya lo dejo para la factura en el paso
              anterior se muestra cual es y no se le pide de nuevo. */}
          <div className="space-y-1.5">
            {showEmailInput ? (
              <>
                <label className="block text-sm font-medium text-foreground">
                  Email para el recibo
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="nombre@email.com"
                    maxLength={120}
                    autoComplete="email"
                    inputMode="email"
                    autoFocus={editingEmail}
                    aria-invalid={!!emailError}
                    className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-base text-foreground placeholder:text-white/45 focus:ring-2 focus:ring-variant-active/20 transition-all ${emailError ? 'border-red-500' : 'border-border focus:border-variant-active'}`}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Recibo y factura
                    </p>
                    <p className="truncate text-sm text-foreground">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="flex-shrink-0 text-[13px] font-medium text-variant-active underline underline-offset-4 transition-opacity hover:opacity-75"
                >
                  Cambiar
                </button>
              </div>
            )}
            {emailError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400"
              >
                {emailError}
              </motion.p>
            )}
          </div>

          <PaymentElement
            onReady={() => {
              setIsElementReady(true);
              paymentElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              fields: {
                billingDetails: {
                  name: 'never',
                  phone: 'never',
                  address: {
                    country: 'never',
                    postalCode: 'never',
                  },
                },
              },
              defaultValues: {
                billingDetails: {
                  name: customerData.name,
                  address: {
                    country: 'PY',
                    city: customerData.location,
                  },
                },
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              terms: {
                card: 'never',
              },
            }}
          />
        </div>
      )}

      {/* Cash on Delivery Info */}
      {paymentMethod === 'cash_on_delivery' && (
        <div className="p-5 bg-variant-active/5 rounded-lg border border-variant-active/20">
          <div className="flex items-start gap-3">
            <BanknotesIcon className="w-6 h-6 text-variant-active flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Pagás recién cuando tenés el producto en mano
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aceptamos efectivo, QR o transferencia al momento de la entrega. Total: {formatPrice(finalTotal, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2">
          Resumen del pedido
        </h3>

        {/* Product */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">
              {productSummary.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cantidad: {item.quantity}
              {productSummary.breakdown ? ` (${productSummary.breakdown})` : ''}
            </p>
          </div>
          <p className="text-sm font-semibold whitespace-nowrap flex-shrink-0 text-foreground">
            {formatPrice(item.amount, currency)}
          </p>
        </div>

        {/* Delivery */}
        <div className="flex justify-between items-center pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground">Delivery</p>
            <span className="px-2 py-0.5 bg-variant-active/10 border border-variant-active/20 rounded text-xs font-semibold text-variant-active">
              GRATIS
            </span>
          </div>
          <p className="text-sm font-semibold text-white/55 line-through">
            Gs. 30.000
          </p>
        </div>

        {/* Los dos upsells: primero el del envio, que cierra el bloque de
            entrega, y despues el producto, pegado al total para que el numero
            se mueva a la vista cuando lo marcan. */}
        <div className="space-y-3">
          <UpsellRow
            checked={isPriorityShipping}
            onToggle={() => setIsPriorityShipping((prev) => !prev)}
            title={PRIORITY_SHIPPING.name}
            // Espacio duro en "en 24hs": a 360px la frase no entra y "24hs" quedaba sola.
            description={'Despacho inmediato en\u00a024hs'}
            price={PRIORITY_SHIPPING.price}
            media={PRIORITY_SHIPPING.image && <ShippingIcon {...PRIORITY_SHIPPING.image} />}
          />

          {/* Con todos los colores agotados el antifaz no se ofrece. Precio
              unico por unidad: el total de la fila es precio por cantidad. */}
          {!ALL_MASK_COLORS_SOLD_OUT && (
            <UpsellRow
              checked={maskPicks.length > 0}
              onToggle={toggleMask}
              title={SLEEP_MASK.name}
              description="Oscuridad total y cero presión en los párpados. Lo que empieza el filtro rojo, lo termina el antifaz."
              price={SLEEP_MASK.price * Math.max(1, maskPicks.length)}
              listPrice={
                SLEEP_MASK.listPrice === undefined
                  ? undefined
                  : SLEEP_MASK.listPrice * Math.max(1, maskPicks.length)
              }
              media={<MaskPhoto color={maskPhotoColor} expanded={maskPicks.length > 0} />}
            >
              <MaskUnits picks={maskPicks} onChange={setMaskPicks} onColorPick={setPickedMaskColor} />
            </UpsellRow>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center gap-3 pt-3 border-t border-border/50">
          <span className="text-base md:text-lg font-bold text-foreground">Total a pagar</span>
          <span className="text-xl md:text-2xl font-bold text-variant-active whitespace-nowrap">
            {formatPrice(finalTotal, currency)}
          </span>
        </div>

        {/* Trust Microcopy */}
        <div className="flex justify-center pt-2">
          <p className="text-xs text-white">
            Envío seguro a todo Paraguay 🇵🇾
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div ref={submitButtonRef} className="space-y-3">
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full h-14 text-sm md:text-base"
          disabled={paymentMethod === 'card' ? (!stripe || !isElementReady || isProcessing) : isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Procesando pedido...
            </>
          ) : (
            <span className="truncate">
              Confirmar Pedido - {formatPrice(finalTotal, currency)}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
          onClick={onCloseAttempt}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export const StripeCheckoutModal = ({
  isOpen,
  onClose,
  onBack,
  onSuccess,
  item,
  currency,
  isProcessingOrder = false,
  customerData,
}: StripeCheckoutModalProps) => {
  const [stripePromise] = useState(() => getStripe());
  const { createPaymentIntent, updatePaymentIntentAmount } = useStripePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  /** Monto que el PaymentIntent tiene realmente. Ver syncPaymentIntentAmount. */
  const syncedAmountRef = useRef<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasShownExitOffer, setHasShownExitOffer] = useState(false);

  // Intercept close attempt - show WhatsApp help if not shown yet
  const handleCloseAttempt = () => {
    if (!hasShownExitOffer) {
      setShowExitConfirm(true);
      setHasShownExitOffer(true);
    } else {
      onClose();
    }
  };

  // User contacts via WhatsApp
  const handleWhatsAppContact = () => {
    const url = buildWhatsAppUrl(
      `Hola! Estaba por comprar NOCTE pero tengo algunas dudas. Mi orden: ${customerData.orderNumber}`
    );
    window.open(url, '_blank');
    setShowExitConfirm(false);
  };

  // User continues without help
  const handleContinueCheckout = () => {
    setShowExitConfirm(false);
  };

  // User exits
  const handleExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  /**
   * Deja el PaymentIntent en `amount`. syncedAmountRef guarda el monto que el
   * intent tiene de verdad, no el del producto: es lo unico que sobrevive a un
   * intento de pago fallido, donde el cliente puede destildar un upsell y
   * dejar la pantalla diciendo un numero mientras Stripe conserva otro.
   */
  const syncPaymentIntentAmount = useCallback(
    async (amount: number) => {
      if (syncedAmountRef.current === amount) return;
      if (!paymentIntentId || !clientSecret) {
        throw new Error('El pago no está inicializado');
      }
      await updatePaymentIntentAmount(paymentIntentId, amount, clientSecret);
      syncedAmountRef.current = amount;
    },
    [updatePaymentIntentAmount, paymentIntentId, clientSecret],
  );

  // Create PaymentIntent when modal opens
  useEffect(() => {
    // Track if effect is still mounted to prevent state updates after unmount
    let isMounted = true;

    if (isOpen && !clientSecret) {
      setIsInitializing(true);
      setInitError(null);

      const { title, breakdown } = describeProduct(item);

      createPaymentIntent({
        // Solo el producto: los upsells todavia no existen cuando el modal
        // abre. El monto se sincroniza antes de confirmar (ver handleSubmit).
        amount: item.amount,
        currency,
        paymentMethodId: 'pending',
        // Initial email: use the factura email if already captured upstream,
        // otherwise a monitored fallback. The real customer email from the
        // card form is re-applied at confirmPayment time via receipt_email
        // and billing_details.email, which Stripe uses for the actual receipt.
        email: customerData.email || FALLBACK_EMAIL,
        metadata: {
          orderNumber: customerData.orderNumber,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          deliveryLocation: customerData.location,
          deliveryAddress: customerData.address,
          quantity: item.quantity.toString(),
          product: breakdown ? `${title} (${breakdown})` : title,
        },
      })
        .then((response) => {
          if (!isMounted) return;
          setClientSecret(response.clientSecret);
          setPaymentIntentId(response.paymentIntentId ?? null);
          // El intent nace con el precio del producto. A partir de aca todo
          // cambio de monto pasa por syncPaymentIntentAmount.
          syncedAmountRef.current = item.amount;
          setIsInitializing(false);
        })
        .catch((error) => {
          if (!isMounted) return;
          setInitError(error.message || 'Error al inicializar el pago');
          setIsInitializing(false);
        });
    }

    // Cleanup function: mark as unmounted when effect re-runs or component unmounts
    return () => {
      isMounted = false;
    };
  }, [isOpen, clientSecret, item, currency, customerData, createPaymentIntent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setPaymentIntentId(null);
      syncedAmountRef.current = null;
      setInitError(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open (iOS-safe, ref-counted)
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => { unlockScroll(); };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 touch-none"
          onClick={handleCloseAttempt}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[550px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[90dvh] overflow-y-auto overflow-x-hidden overscroll-contain touch-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
              aria-label="Cerrar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Back Button */}
            <button
              onClick={onBack}
              className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center gap-1"
              aria-label="Volver al paso anterior"
            >
              ← Volver
            </button>

            {/* Header */}
            <div className="mb-6 text-center pt-6 space-y-6">
              {/* Progress Bar */}
              <CheckoutProgressBar currentStep={2} />

              <div>
                <div className="inline-block px-3 py-1 bg-variant-active/10 border border-variant-active/20 rounded-md mb-4">
                  <p className="text-xs font-semibold text-variant-active tracking-wide">
                    PAGO SEGURO
                  </p>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Finalizar Compra
                </h2>
                <p className="text-sm text-muted-foreground">
                  Orden {customerData.orderNumber}
                </p>
              </div>
            </div>

            {/* Loading or Error State */}
            {isInitializing && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-variant-active/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Preparando método de pago...
                </p>
              </div>
            )}

            {initError && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 text-center">{initError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full mt-4 bg-transparent border-border/50 hover:bg-secondary/50"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            )}

            {/* Stripe Elements */}
            {!isInitializing && !initError && clientSecret && (
              <>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    locale: 'es',
                    loader: 'auto',
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#EF4444',
                        colorBackground: '#000000',
                        colorText: '#F9FAFB',
                        colorDanger: '#DC2626',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSizeBase: '16px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    onSuccess={onSuccess}
                    onClose={onClose}
                    onBack={onBack}
                    item={item}
                    currency={currency}
                    customerData={customerData}
                    onCloseAttempt={handleCloseAttempt}
                    syncPaymentIntentAmount={syncPaymentIntentAmount}
                  />
                </Elements>
              </>
            )}

            {/* Exit WhatsApp Help Overlay */}
            <AnimatePresence>
              {showExitConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-6 rounded-xl backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center space-y-5 max-w-md w-full">
                    {/* Headline */}
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        ¿Necesitás ayuda para completar tu compra?
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed px-2">
                        Nuestro equipo está disponible por WhatsApp para resolver tus dudas al instante.
                        <span className="block mt-2 text-foreground font-medium">
                          Respondemos en menos de 2 minutos 🇵🇾
                        </span>
                      </p>
                    </div>

                    {/* Benefits of contacting */}
                    <div className="text-left space-y-2 bg-secondary/30 border border-border/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Resolvemos todas tus dudas sobre el producto</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Te ayudamos a completar tu pedido paso a paso</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Atención personalizada en español 🇵🇾</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-3">
                      <Button
                        type="button"
                        variant="hero"
                        size="xl"
                        className="w-full h-14 text-base font-semibold bg-green-500 hover:bg-green-600"
                        onClick={handleWhatsAppContact}
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Hablar por WhatsApp
                      </Button>
                      <button
                        type="button"
                        onClick={handleContinueCheckout}
                        className="w-full text-sm font-medium text-foreground hover:text-variant-active transition-colors py-2 underline"
                      >
                        Continuar sin ayuda
                      </button>
                      <button
                        type="button"
                        onClick={handleExit}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Order Overlay */}
            <AnimatePresence>
              {isProcessingOrder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 p-6 rounded-xl backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center space-y-4 max-w-sm w-full">
                    <div className="w-16 h-16 border-4 border-variant-active/30 border-t-primary rounded-full animate-spin mx-auto" />
                    <h3 className="text-xl md:text-2xl font-bold text-white">Procesando tu pedido...</h3>
                    <p className="text-sm text-white leading-relaxed">
                      Estamos confirmando tu orden y enviando los detalles. Esto tomará solo unos segundos.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StripeCheckoutModal;
