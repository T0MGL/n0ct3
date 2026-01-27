import { Link } from "react-router-dom";
import { useEffect } from "react";

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <header className="mb-12 md:mb-16">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tighter opacity-70 hover:opacity-100 transition-opacity"
          >
            NOCTE<sup className="text-[0.5em] ml-0.5">&reg;</sup>
          </Link>
        </header>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          T&eacute;rminos y Condiciones
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          &Uacute;ltima actualizaci&oacute;n: 27 de enero de 2026
        </p>

        <div className="space-y-10 text-sm md:text-base leading-relaxed text-muted-foreground">
          {/* 1. Aceptaci&oacute;n */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              1. Aceptaci&oacute;n de los T&eacute;rminos
            </h2>
            <p>
              Al acceder y utilizar el sitio web{" "}
              <span className="text-foreground">nocte.studio</span> (en adelante, el &ldquo;Sitio&rdquo;) y al realizar una compra, acept&aacute;s estos T&eacute;rminos y Condiciones en su totalidad. Si no est&aacute;s de acuerdo con alguno de estos t&eacute;rminos, te pedimos que no utilices el Sitio.
            </p>
            <p>
              NOCTE&reg; (en adelante, &ldquo;NOCTE&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;) opera desde Asunci&oacute;n, Paraguay, y estos t&eacute;rminos se rigen por la legislaci&oacute;n paraguaya vigente, incluyendo la Ley 4868/2013 de Comercio Electr&oacute;nico y la Ley 1334/1998 de Defensa del Consumidor.
            </p>
          </section>

          {/* 2. Producto */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              2. Descripci&oacute;n del Producto
            </h2>
            <p>
              NOCTE comercializa lentes anti luz azul dise&ntilde;ados para uso nocturno frente a pantallas. Las im&aacute;genes y descripciones del producto en el Sitio son representativas y pueden presentar variaciones menores respecto al producto f&iacute;sico.
            </p>
            <p>
              Los lentes NOCTE no son un dispositivo m&eacute;dico. No diagnostican, tratan, curan ni previenen enfermedades. Los resultados pueden variar seg&uacute;n cada persona. Ante cualquier condici&oacute;n m&eacute;dica, consult&aacute; con un profesional de la salud.
            </p>
          </section>

          {/* 3. Compra */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              3. Proceso de Compra y Precios
            </h2>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                Los precios est&aacute;n expresados en Guaran&iacute;es (PYG) e incluyen impuestos aplicables.
              </li>
              <li>
                NOCTE se reserva el derecho de modificar los precios en cualquier momento sin previo aviso. El precio aplicable es el vigente al momento de confirmar tu pedido.
              </li>
              <li>
                La compra se perfecciona una vez que recib&iacute;s la confirmaci&oacute;n del pedido por parte de NOCTE.
              </li>
              <li>
                Nos reservamos el derecho de rechazar o cancelar pedidos por motivos de disponibilidad de stock, errores en la informaci&oacute;n del producto o sospecha de fraude.
              </li>
            </ul>
          </section>

          {/* 4. Pago */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              4. M&eacute;todos de Pago
            </h2>
            <p>
              Los pagos se procesan de forma segura a trav&eacute;s de Stripe, una plataforma certificada PCI DSS. NOCTE no almacena datos de tarjetas de cr&eacute;dito ni d&eacute;bito en sus servidores.
            </p>
            <p>
              Los m&eacute;todos de pago disponibles se muestran durante el proceso de compra. Todos los pagos est&aacute;n sujetos a verificaci&oacute;n y autorizaci&oacute;n por parte del emisor de la tarjeta.
            </p>
          </section>

          {/* 5. Env&iacute;o */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              5. Env&iacute;o y Entrega
            </h2>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                Env&iacute;o gratuito a Asunci&oacute;n y Departamento Central.
              </li>
              <li>
                Plazo estimado de entrega: 1 a 2 d&iacute;as h&aacute;biles despu&eacute;s de confirmado el pedido.
              </li>
              <li>
                Los plazos de entrega son estimaciones y pueden variar por circunstancias fuera de nuestro control (condiciones clim&aacute;ticas, feriados, etc.).
              </li>
              <li>
                Es responsabilidad del comprador proporcionar una direcci&oacute;n de entrega correcta y completa.
              </li>
            </ul>
          </section>

          {/* 6. Garant&iacute;a */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              6. Garant&iacute;a y Pol&iacute;tica de Devoluci&oacute;n
            </h2>
            <p>
              NOCTE ofrece una garant&iacute;a de satisfacci&oacute;n de 30 d&iacute;as calendario a partir de la fecha de entrega del producto.
            </p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                Si no est&aacute;s satisfecho con tu compra dentro de los 30 d&iacute;as, pod&eacute;s solicitar la devoluci&oacute;n del 100% del precio pagado.
              </li>
              <li>
                Para iniciar una devoluci&oacute;n, contact&aacute; a{" "}
                <span className="text-foreground">contacto@nocte.studio</span> o por WhatsApp al{" "}
                <span className="text-foreground">+595 991 893 587</span>.
              </li>
              <li>
                El producto debe ser devuelto en condiciones razonables de uso.
              </li>
              <li>
                El reembolso se procesar&aacute; por el mismo medio de pago original dentro de los 10 d&iacute;as h&aacute;biles siguientes a la recepci&oacute;n del producto devuelto.
              </li>
            </ul>
          </section>

          {/* 7. Propiedad intelectual */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              7. Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido del Sitio &mdash;incluyendo textos, im&aacute;genes, logotipos, dise&ntilde;os, software y la marca NOCTE&reg;&mdash; es propiedad de NOCTE o de sus licenciantes y est&aacute; protegido por las leyes de propiedad intelectual de la Rep&uacute;blica del Paraguay y tratados internacionales aplicables.
            </p>
            <p>
              Queda prohibida la reproducci&oacute;n, distribuci&oacute;n, modificaci&oacute;n o uso comercial de cualquier contenido del Sitio sin autorizaci&oacute;n escrita previa de NOCTE.
            </p>
          </section>

          {/* 8. Limitaci&oacute;n de responsabilidad */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              8. Limitaci&oacute;n de Responsabilidad
            </h2>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                NOCTE no garantiza que el Sitio est&eacute; disponible de forma ininterrumpida o libre de errores.
              </li>
              <li>
                No somos responsables por da&ntilde;os indirectos, incidentales o consecuentes derivados del uso del Sitio o de los productos.
              </li>
              <li>
                Nuestra responsabilidad m&aacute;xima se limita al precio pagado por el producto adquirido.
              </li>
              <li>
                Las limitaciones anteriores aplican en la medida permitida por la legislaci&oacute;n paraguaya y no afectan los derechos irrenunciables del consumidor conforme a la Ley 1334/1998.
              </li>
            </ul>
          </section>

          {/* 9. Uso aceptable */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              9. Uso Aceptable del Sitio
            </h2>
            <p>Al utilizar el Sitio, te compromet&eacute;s a:</p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>Proporcionar informaci&oacute;n veraz y actualizada.</li>
              <li>No utilizar el Sitio con fines il&iacute;citos o fraudulentos.</li>
              <li>
                No intentar acceder de forma no autorizada a sistemas o datos del Sitio.
              </li>
              <li>
                No reproducir, duplicar o explotar comercialmente el contenido del Sitio sin autorizaci&oacute;n.
              </li>
            </ul>
            <p>
              NOCTE se reserva el derecho de restringir el acceso a cualquier usuario que incumpla estos t&eacute;rminos.
            </p>
          </section>

          {/* 10. Comunicaciones */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              10. Comunicaciones Electr&oacute;nicas
            </h2>
            <p>
              Al realizar una compra, acept&aacute;s recibir comunicaciones electr&oacute;nicas relacionadas con tu pedido (confirmaci&oacute;n, estado de env&iacute;o, etc.). Las comunicaciones comerciales y promocionales solo se enviar&aacute;n con tu consentimiento previo, y pod&eacute;s darte de baja en cualquier momento.
            </p>
          </section>

          {/* 11. Modificaciones */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              11. Modificaciones a estos T&eacute;rminos
            </h2>
            <p>
              NOCTE se reserva el derecho de modificar estos T&eacute;rminos y Condiciones en cualquier momento. Los cambios entrar&aacute;n en vigencia desde su publicaci&oacute;n en el Sitio. La fecha de &uacute;ltima actualizaci&oacute;n se indica al inicio de este documento. El uso continuado del Sitio despu&eacute;s de cualquier modificaci&oacute;n constituye la aceptaci&oacute;n de los t&eacute;rminos actualizados.
            </p>
          </section>

          {/* 12. Privacidad */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              12. Privacidad
            </h2>
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link
                to="/politica-de-privacidad"
                className="text-foreground underline hover:text-primary transition-colors"
              >
                Pol&iacute;tica de Privacidad
              </Link>
              , la cual forma parte integral de estos T&eacute;rminos y Condiciones.
            </p>
          </section>

          {/* 13. Ley aplicable */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              13. Ley Aplicable y Jurisdicci&oacute;n
            </h2>
            <p>
              Estos T&eacute;rminos y Condiciones se rigen por las leyes de la Rep&uacute;blica del Paraguay. Cualquier controversia derivada del uso del Sitio o de la compra de productos ser&aacute; sometida a los tribunales ordinarios competentes de la ciudad de Asunci&oacute;n, Paraguay, sin perjuicio de los derechos del consumidor establecidos en la Ley 1334/1998 de Defensa del Consumidor.
            </p>
          </section>

          {/* 14. Contacto */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              14. Contacto
            </h2>
            <p>
              Para cualquier consulta relacionada con estos T&eacute;rminos y Condiciones:
            </p>
            <ul className="space-y-1.5 pl-4">
              <li>
                Correo electr&oacute;nico:{" "}
                <span className="text-foreground">contacto@nocte.studio</span>
              </li>
              <li>
                WhatsApp:{" "}
                <span className="text-foreground">+595 991 893 587</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/30 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
