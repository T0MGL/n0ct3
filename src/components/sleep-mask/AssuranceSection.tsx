import { BanknotesIcon, ShieldCheckIcon, TruckIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";

// Hechos de la tienda que valen para cualquier producto NOCTE. La garantia es
// la de Terminos y Condiciones, seccion 6: de satisfaccion, 30 dias desde la
// entrega. No se promete nada que esa seccion no diga.
const FACTS = [
  {
    icon: TruckIcon,
    title: "Delivery gratis",
    body: "A todo Paraguay, estés en Asunción o en el interior.",
  },
  {
    icon: BanknotesIcon,
    title: "Pagás al recibir",
    body: "En efectivo, QR o transferencia cuando te llega. O con tarjeta en el checkout.",
  },
  {
    icon: ShieldCheckIcon,
    title: "30 días de garantía",
    body: "Garantía de satisfacción desde que lo recibís. Nos escribís por WhatsApp y lo resolvemos.",
  },
] as const;

export const AssuranceSection = () => (
  <section aria-labelledby="mask-assurance-title" className="bg-black px-5 py-24 sm:px-8 md:py-32">
    <div className="mx-auto max-w-[1200px]">
      <Reveal
        as="h2"
        id="mask-assurance-title"
        className="max-w-[18ch] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance] md:text-5xl lg:text-[60px]"
      >
        Lo pagás cuando lo tenés en la mano.
      </Reveal>

      <ul className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-10">
        {FACTS.map(({ icon: Icon, title, body }, index) => (
          <Reveal as="li" key={title} delay={index * 70} className="border-t border-white/15 pt-6">
            <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
            <p className="mt-4 text-lg font-semibold text-white md:text-xl">{title}</p>
            <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-white/65">{body}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
);
