import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const PoliticaPrivacidad = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-border/30">
        <div className="container max-w-[900px] mx-auto px-4 md:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm">Volver al inicio</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-[900px] mx-auto px-4 md:px-6 py-8 md:py-12 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Última actualización: {new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-8">
          {/* Introducción */}
          <section className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® ("nosotros", "nuestro" o "la empresa") se compromete a proteger la privacidad de sus datos personales
              de conformidad con la <strong>Ley N° 6534/2020 de Protección de Datos Personales Crediticios</strong> de la
              República del Paraguay y demás normativas aplicables.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos su información
              personal cuando utiliza nuestro sitio web y realiza compras de nuestros productos.
            </p>
          </section>

          {/* 1. Responsable del Tratamiento */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">1. Responsable del Tratamiento de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              El responsable del tratamiento de sus datos personales es NOCTE®, con domicilio en Asunción, Paraguay.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para cualquier consulta relacionada con el tratamiento de sus datos personales, puede contactarnos a través de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>WhatsApp: +595 991 893587</li>
              <li>Instagram: @noctepy</li>
            </ul>
          </section>

          {/* 2. Datos que Recopilamos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">2. Datos Personales que Recopilamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Recopilamos los siguientes datos personales con su consentimiento expreso al realizar una compra:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Datos de identificación:</strong> Nombre completo</li>
              <li><strong>Datos de contacto:</strong> Número de teléfono celular</li>
              <li><strong>Datos de ubicación:</strong> Dirección de entrega, ciudad, coordenadas de ubicación (opcional, para facilitar la entrega)</li>
              <li><strong>Datos de la transacción:</strong> Productos adquiridos, monto, fecha de compra, método de pago seleccionado</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>No recopilamos:</strong> Datos bancarios completos, números de tarjeta de crédito (estos son procesados
              directamente por nuestro proveedor de pagos Stripe, quien cuenta con certificación PCI-DSS).
            </p>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">3. Finalidad del Tratamiento de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus datos personales serán utilizados exclusivamente para las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Procesar y gestionar su pedido</li>
              <li>Coordinar la entrega de su producto</li>
              <li>Contactarlo en caso de incidencias con su pedido</li>
              <li>Gestionar devoluciones o reclamos bajo nuestra garantía de 30 días</li>
              <li>Cumplir con obligaciones legales y tributarias</li>
              <li>Enviar comunicaciones relacionadas con su compra (confirmación, estado del envío)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>No utilizamos sus datos para:</strong> Envío de publicidad no solicitada, venta a terceros,
              o cualquier finalidad distinta a las aquí mencionadas sin su consentimiento previo.
            </p>
          </section>

          {/* 4. Base Legal */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">4. Base Legal del Tratamiento</h2>
            <p className="text-muted-foreground leading-relaxed">
              El tratamiento de sus datos se fundamenta en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Consentimiento:</strong> Otorgado al completar el formulario de compra</li>
              <li><strong>Ejecución contractual:</strong> Necesario para procesar y entregar su pedido</li>
              <li><strong>Obligaciones legales:</strong> Cumplimiento de normativas tributarias paraguayas</li>
            </ul>
          </section>

          {/* 5. Conservación de Datos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">5. Conservación de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus datos personales serán conservados durante el tiempo necesario para cumplir con las finalidades
              descritas y por el período requerido por la legislación tributaria paraguaya (mínimo 5 años para
              documentación comercial según el Código Civil paraguayo).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Una vez cumplido este período, sus datos serán eliminados de forma segura.
            </p>
          </section>

          {/* 6. Derechos del Titular */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">6. Sus Derechos (ARCO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              De acuerdo con la Ley N° 6534/2020, usted tiene los siguientes derechos sobre sus datos personales:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Acceso:</strong> Conocer qué datos suyos tenemos almacenados</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Cancelación/Supresión:</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos para finalidades específicas</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para ejercer estos derechos, puede contactarnos por WhatsApp o Instagram. Responderemos a su solicitud
              en un plazo máximo de 10 días hábiles.
            </p>
          </section>

          {/* 7. Seguridad */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">7. Medidas de Seguridad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas y organizativas para proteger sus datos personales contra acceso
              no autorizado, pérdida, alteración o destrucción, incluyendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Conexiones seguras mediante protocolo HTTPS/SSL</li>
              <li>Procesamiento de pagos a través de Stripe (certificación PCI-DSS nivel 1)</li>
              <li>Acceso restringido a datos personales solo a personal autorizado</li>
              <li>Almacenamiento en servidores seguros</li>
            </ul>
          </section>

          {/* 8. Transferencia de Datos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">8. Transferencia de Datos a Terceros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus datos pueden ser compartidos únicamente con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Servicio de entregas:</strong> Para coordinar la entrega de su pedido (solo nombre, teléfono y dirección)</li>
              <li><strong>Procesador de pagos (Stripe):</strong> Para procesar transacciones con tarjeta de manera segura</li>
              <li><strong>Autoridades competentes:</strong> Cuando sea requerido por ley</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines de marketing.
            </p>
          </section>

          {/* 9. Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">9. Cookies y Tecnologías de Seguimiento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuestro sitio web utiliza cookies y tecnologías similares para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Garantizar el funcionamiento correcto del sitio</li>
              <li>Analizar el tráfico del sitio (Google Analytics)</li>
              <li>Medir la efectividad de nuestras campañas publicitarias (Meta Pixel)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
            </p>
          </section>

          {/* 10. Menores */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">10. Menores de Edad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuestros productos y servicios están dirigidos a personas mayores de 18 años. No recopilamos
              intencionalmente datos de menores de edad. Si detectamos que hemos recopilado datos de un menor,
              procederemos a eliminarlos inmediatamente.
            </p>
          </section>

          {/* 11. Cambios */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">11. Modificaciones a esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento.
              Las modificaciones entrarán en vigencia desde su publicación en este sitio web.
              Le recomendamos revisar periódicamente esta página.
            </p>
          </section>

          {/* 12. Contacto */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">12. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos,
              puede contactarnos a través de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>WhatsApp: +595 991 893587</li>
              <li>Instagram: @noctepy</li>
            </ul>
          </section>

          {/* Marco Legal */}
          <section className="mt-12 pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Esta Política de Privacidad se rige por la legislación de la República del Paraguay,
              en particular la Ley N° 6534/2020 "De Protección de Datos Personales Crediticios",
              la Ley N° 1334/98 "De Defensa del Consumidor y del Usuario", el Código Civil paraguayo
              y demás normativas aplicables.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-border/30 py-8 px-4">
        <div className="container max-w-[900px] mx-auto text-center">
          <p className="text-2xl font-bold tracking-tighter opacity-70">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup></p>
          <p className="text-[10px] md:text-xs text-muted-foreground/60 font-light mt-4">
            © {new Date().getFullYear()} NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PoliticaPrivacidad;
