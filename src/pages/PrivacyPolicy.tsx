import { Link } from "react-router-dom";
import { useEffect } from "react";

const PrivacyPolicy = () => {
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
          Pol&iacute;tica de Privacidad
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          &Uacute;ltima actualizaci&oacute;n: 27 de enero de 2026
        </p>

        <div className="space-y-10 text-sm md:text-base leading-relaxed text-muted-foreground">
          {/* 1. Responsable */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              1. Responsable del Tratamiento de Datos
            </h2>
            <p>
              NOCTE&reg; (en adelante, &ldquo;NOCTE&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;) es responsable del tratamiento de los datos personales recopilados a trav&eacute;s del sitio web{" "}
              <span className="text-foreground">nocte.studio</span> y sus servicios asociados.
            </p>
            <ul className="space-y-1.5 pl-4">
              <li>Domicilio: Asunci&oacute;n, Paraguay</li>
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

          {/* 2. Datos que recopilamos */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              2. Datos Personales que Recopilamos
            </h2>
            <p>Recopilamos las siguientes categor&iacute;as de datos personales:</p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Datos de identidad:</span>{" "}
                nombre completo y c&eacute;dula de identidad (cuando aplique).
              </li>
              <li>
                <span className="text-foreground font-medium">Datos de contacto:</span>{" "}
                direcci&oacute;n de correo electr&oacute;nico, n&uacute;mero de tel&eacute;fono, direcci&oacute;n f&iacute;sica de env&iacute;o.
              </li>
              <li>
                <span className="text-foreground font-medium">Datos de transacci&oacute;n:</span>{" "}
                historial de compras, informaci&oacute;n de pago (procesada por terceros), datos de pedido.
              </li>
              <li>
                <span className="text-foreground font-medium">Datos t&eacute;cnicos:</span>{" "}
                direcci&oacute;n IP, tipo y versi&oacute;n del navegador, tipo de dispositivo, sistema operativo, zona horaria.
              </li>
              <li>
                <span className="text-foreground font-medium">Datos de uso:</span>{" "}
                p&aacute;ginas visitadas, tiempo de permanencia, patrones de navegaci&oacute;n.
              </li>
            </ul>
          </section>

          {/* 3. C&oacute;mo recopilamos datos */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              3. C&oacute;mo Recopilamos los Datos
            </h2>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Directamente:</span>{" "}
                cuando realiz&aacute;s una compra, complet&aacute;s un formulario o nos contact&aacute;s por WhatsApp o correo electr&oacute;nico.
              </li>
              <li>
                <span className="text-foreground font-medium">Autom&aacute;ticamente:</span>{" "}
                mediante cookies, p&iacute;xeles de seguimiento y tecnolog&iacute;as similares al navegar nuestro sitio web.
              </li>
              <li>
                <span className="text-foreground font-medium">De terceros:</span>{" "}
                procesadores de pago y plataformas de an&aacute;lisis que nos proporcionan datos t&eacute;cnicos y de transacci&oacute;n.
              </li>
            </ul>
          </section>

          {/* 4. Finalidad */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              4. Finalidad del Tratamiento
            </h2>
            <p>Utilizamos los datos personales para las siguientes finalidades:</p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>Procesar y gestionar pedidos, env&iacute;os y devoluciones.</li>
              <li>Comunicarnos con vos respecto a tu compra o consulta.</li>
              <li>Mejorar nuestro sitio web, productos y servicios.</li>
              <li>Prevenir fraudes y garantizar la seguridad del sitio.</li>
              <li>Cumplir con obligaciones legales y tributarias.</li>
              <li>
                Enviar comunicaciones comerciales (solo con tu consentimiento previo).
              </li>
            </ul>
          </section>

          {/* 5. Base legal */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              5. Base Legal del Tratamiento
            </h2>
            <p>
              El tratamiento de tus datos se fundamenta en las siguientes bases legales, de conformidad con la legislaci&oacute;n paraguaya vigente:
            </p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Ejecuci&oacute;n contractual:</span>{" "}
                para procesar tu compra y cumplir con nuestras obligaciones de venta y env&iacute;o.
              </li>
              <li>
                <span className="text-foreground font-medium">Consentimiento:</span>{" "}
                para el env&iacute;o de comunicaciones comerciales y el uso de cookies no esenciales.
              </li>
              <li>
                <span className="text-foreground font-medium">Obligaci&oacute;n legal:</span>{" "}
                para cumplir con la Ley 4868/2013 de Comercio Electr&oacute;nico, la Ley 6534/2020 y dem&aacute;s normativa aplicable.
              </li>
              <li>
                <span className="text-foreground font-medium">Inter&eacute;s leg&iacute;timo:</span>{" "}
                para la prevenci&oacute;n de fraudes, seguridad del sitio y an&aacute;lisis estad&iacute;stico.
              </li>
            </ul>
          </section>

          {/* 6. Cookies */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              6. Cookies y Tecnolog&iacute;as de Rastreo
            </h2>
            <p>Nuestro sitio utiliza las siguientes tecnolog&iacute;as:</p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Cookies esenciales:</span>{" "}
                necesarias para el funcionamiento del sitio (sesi&oacute;n, carrito de compras).
              </li>
              <li>
                <span className="text-foreground font-medium">Cookies de an&aacute;lisis:</span>{" "}
                para comprender c&oacute;mo los usuarios interact&uacute;an con el sitio y mejorar la experiencia.
              </li>
              <li>
                <span className="text-foreground font-medium">P&iacute;xeles de seguimiento:</span>{" "}
                utilizamos Meta Pixel (Facebook) para medir la efectividad de nuestras campa&ntilde;as publicitarias.
              </li>
            </ul>
            <p>
              Pod&eacute;s gestionar o deshabilitar las cookies desde la configuraci&oacute;n de tu navegador. Ten&eacute; en cuenta que deshabilitar cookies esenciales puede afectar la funcionalidad del sitio.
            </p>
          </section>

          {/* 7. Terceros */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              7. Compartici&oacute;n de Datos con Terceros
            </h2>
            <p>
              Compartimos datos personales &uacute;nicamente con terceros necesarios para la prestaci&oacute;n de nuestros servicios:
            </p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Procesadores de pago:</span>{" "}
                Stripe, para procesar pagos de forma segura. NOCTE no almacena datos de tarjetas de cr&eacute;dito o d&eacute;bito.
              </li>
              <li>
                <span className="text-foreground font-medium">Servicios de env&iacute;o:</span>{" "}
                empresas de log&iacute;stica para la entrega de pedidos.
              </li>
              <li>
                <span className="text-foreground font-medium">Plataformas publicitarias:</span>{" "}
                Meta (Facebook/Instagram) para campa&ntilde;as de marketing.
              </li>
            </ul>
            <p>
              No vendemos, alquilamos ni cedemos datos personales a terceros con fines comerciales propios.
            </p>
          </section>

          {/* 8. Transferencias internacionales */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              8. Transferencias Internacionales de Datos
            </h2>
            <p>
              Algunos de nuestros proveedores de servicios (procesadores de pago, alojamiento web, an&aacute;lisis) pueden estar ubicados fuera de Paraguay. En estos casos, nos aseguramos de que dichos proveedores mantengan est&aacute;ndares de protecci&oacute;n de datos equivalentes mediante acuerdos contractuales adecuados.
            </p>
          </section>

          {/* 9. Seguridad */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              9. Medidas de Seguridad
            </h2>
            <p>
              Implementamos medidas t&eacute;cnicas y organizativas para proteger tus datos personales, incluyendo:
            </p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>Cifrado SSL/TLS en todas las comunicaciones del sitio.</li>
              <li>Procesamiento de pagos a trav&eacute;s de pasarelas certificadas PCI DSS.</li>
              <li>Controles de acceso restringido a datos personales.</li>
            </ul>
            <p>
              Ning&uacute;n sistema es completamente infalible. En caso de una brecha de seguridad que afecte tus datos, te notificaremos a la brevedad posible.
            </p>
          </section>

          {/* 10. Retenci&oacute;n */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              10. Retenci&oacute;n de Datos
            </h2>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Datos de transacci&oacute;n:</span>{" "}
                seg&uacute;n lo requerido por la legislaci&oacute;n tributaria paraguaya (m&iacute;nimo 5 a&ntilde;os).
              </li>
              <li>
                <span className="text-foreground font-medium">Datos t&eacute;cnicos y de tr&aacute;fico:</span>{" "}
                m&iacute;nimo 6 meses, conforme al Art&iacute;culo 10 de la Ley 4868/2013.
              </li>
              <li>
                <span className="text-foreground font-medium">Datos de marketing:</span>{" "}
                hasta que retires tu consentimiento.
              </li>
            </ul>
            <p>
              Una vez cumplido el plazo de retenci&oacute;n, los datos son eliminados o anonimizados de forma segura.
            </p>
          </section>

          {/* 11. Derechos */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              11. Tus Derechos
            </h2>
            <p>
              De acuerdo con la Constituci&oacute;n Nacional (Art&iacute;culo 135 &mdash; Habeas Data), la Ley 6534/2020 y la Ley 7593/2025 de Protecci&oacute;n de Datos Personales, ten&eacute;s derecho a:
            </p>
            <ul className="space-y-2 pl-4 list-disc list-outside">
              <li>
                <span className="text-foreground font-medium">Acceso:</span>{" "}
                solicitar una copia de los datos personales que tenemos sobre vos.
              </li>
              <li>
                <span className="text-foreground font-medium">Rectificaci&oacute;n:</span>{" "}
                solicitar la correcci&oacute;n de datos inexactos o incompletos.
              </li>
              <li>
                <span className="text-foreground font-medium">Supresi&oacute;n:</span>{" "}
                solicitar la eliminaci&oacute;n de tus datos personales.
              </li>
              <li>
                <span className="text-foreground font-medium">Oposici&oacute;n:</span>{" "}
                oponerte al uso de tus datos para fines promocionales (Art. 22, Ley 4868/2013).
              </li>
              <li>
                <span className="text-foreground font-medium">Portabilidad:</span>{" "}
                recibir tus datos en un formato estructurado y de uso com&uacute;n.
              </li>
              <li>
                <span className="text-foreground font-medium">Retiro del consentimiento:</span>{" "}
                retirar tu consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento previo.
              </li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, escrib&iacute; a{" "}
              <span className="text-foreground">contacto@nocte.studio</span>. Responderemos en un plazo m&aacute;ximo de 15 d&iacute;as h&aacute;biles, sin costo alguno.
            </p>
          </section>

          {/* 12. Menores */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              12. Protecci&oacute;n de Menores
            </h2>
            <p>
              Nuestro sitio web y servicios no est&aacute;n dirigidos a menores de 16 a&ntilde;os. No recopilamos intencionalmente datos personales de menores. Si tom&aacute;s conocimiento de que un menor nos proporcion&oacute; datos sin el consentimiento de su padre, madre o tutor, contact&aacute; a{" "}
              <span className="text-foreground">contacto@nocte.studio</span> para que procedamos a su eliminaci&oacute;n.
            </p>
          </section>

          {/* 13. Comunicaciones comerciales */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              13. Comunicaciones Comerciales
            </h2>
            <p>
              Solo enviamos comunicaciones comerciales (correo electr&oacute;nico, WhatsApp u otros medios) con tu consentimiento previo y expl&iacute;cito. Cada comunicaci&oacute;n incluye un mecanismo claro y gratuito para darte de baja, conforme a los Art&iacute;culos 22 y 23 de la Ley 4868/2013 y la Ley 5830/2017.
            </p>
          </section>

          {/* 14. Cambios */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              14. Cambios a esta Pol&iacute;tica
            </h2>
            <p>
              Nos reservamos el derecho de actualizar esta Pol&iacute;tica de Privacidad para reflejar cambios en nuestras pr&aacute;cticas o en la legislaci&oacute;n aplicable. La fecha de &uacute;ltima actualizaci&oacute;n se indica al inicio de este documento. Te recomendamos revisarla peri&oacute;dicamente.
            </p>
          </section>

          {/* 15. Contacto */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              15. Contacto y Reclamaciones
            </h2>
            <p>
              Para cualquier consulta, solicitud o reclamaci&oacute;n relacionada con esta pol&iacute;tica o el tratamiento de tus datos personales:
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
            <p>
              Tambi&eacute;n pod&eacute;s presentar una reclamaci&oacute;n ante la Secretar&iacute;a de Defensa del Consumidor y el Usuario (SEDECO) o la autoridad competente en materia de protecci&oacute;n de datos personales.
            </p>
          </section>

          {/* 16. Ley aplicable */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              16. Ley Aplicable y Jurisdicci&oacute;n
            </h2>
            <p>
              Esta Pol&iacute;tica de Privacidad se rige por las leyes de la Rep&uacute;blica del Paraguay, incluyendo la Constituci&oacute;n Nacional, la Ley 4868/2013 de Comercio Electr&oacute;nico, la Ley 6534/2020, la Ley 7593/2025 de Protecci&oacute;n de Datos Personales y dem&aacute;s normativa aplicable. Cualquier controversia ser&aacute; sometida a los tribunales competentes de la ciudad de Asunci&oacute;n, Paraguay.
            </p>
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

export default PrivacyPolicy;
