import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const TerminosCondiciones = () => {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Última actualización: {new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-8">
          {/* Introducción */}
          <section className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Bienvenido a NOCTE® Paraguay. Los presentes Términos y Condiciones regulan el uso de nuestro sitio web
              y la compra de nuestros productos. Al realizar una compra, usted acepta estos términos en su totalidad.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Estos términos se rigen por la <strong>Ley N° 1334/98 de Defensa del Consumidor y del Usuario</strong> de
              la República del Paraguay y demás normativas aplicables.
            </p>
          </section>

          {/* 1. Identificación */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">1. Identificación del Vendedor</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Nombre comercial:</strong> NOCTE® Paraguay</li>
              <li><strong>Domicilio:</strong> Asunción, Paraguay</li>
              <li><strong>Contacto:</strong> WhatsApp +595 991 893587 | Instagram @noctepy</li>
            </ul>
          </section>

          {/* 2. Productos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">2. Productos y Descripción</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® comercializa lentes con tecnología de bloqueo de luz azul diseñados para uso nocturno.
              Las características y especificaciones de los productos se detallan en nuestro sitio web.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Contenido del producto:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>1 par de lentes rojos NOCTE®</li>
              <li>Garantía de 30 días</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Las imágenes de los productos son ilustrativas. Pueden existir variaciones mínimas en tonalidad
              debido a la configuración de pantalla de cada dispositivo.
            </p>
          </section>

          {/* 3. Precios */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">3. Precios y Formas de Pago</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos los precios están expresados en Guaraníes (Gs.) e incluyen IVA cuando corresponda.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Formas de pago aceptadas:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Tarjeta de crédito/débito:</strong> Procesado de forma segura por Stripe</li>
              <li><strong>Pago contra entrega:</strong> En efectivo al momento de recibir el producto (solo Asunción y Departamento Central)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Los precios pueden variar sin previo aviso. El precio aplicable será el vigente al momento de confirmar su compra.
            </p>
          </section>

          {/* 4. Proceso de Compra */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">4. Proceso de Compra</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al realizar una compra en nuestro sitio:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
              <li>Seleccione la cantidad de productos deseada</li>
              <li>Complete sus datos personales y dirección de entrega</li>
              <li>Seleccione su método de pago preferido</li>
              <li>Confirme su pedido</li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Recibirá una confirmación de su pedido por WhatsApp. El contrato de compraventa se perfecciona
              al recibir dicha confirmación.
            </p>
          </section>

          {/* 5. Envíos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">5. Envíos y Entregas</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Zona de cobertura:</strong> Asunción y Departamento Central
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Costo de envío:</strong> GRATIS para todas las compras dentro de la zona de cobertura
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Plazo de entrega:</strong> 1-2 días hábiles después de confirmada la compra
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Los plazos de entrega son estimados y pueden variar por factores externos como clima o
              disponibilidad del destinatario. Nos comunicaremos por WhatsApp para coordinar la entrega.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              De acuerdo con el artículo 26 de la Ley 1334/98, el proveedor tiene la obligación de
              entregar el producto en los términos ofrecidos.
            </p>
          </section>

          {/* 6. Garantía */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">6. Garantía de Satisfacción</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® ofrece una <strong>garantía de satisfacción de 30 días</strong> a partir de la fecha de entrega.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Cobertura de la garantía:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Defectos de fabricación</li>
              <li>Productos que no cumplen con las especificaciones descritas</li>
              <li>Insatisfacción con el producto</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Procedimiento:</strong> Contacte a nuestro servicio al cliente por WhatsApp indicando
              su número de pedido y el motivo del reclamo. Coordinaremos el retiro del producto y,
              una vez verificada la condición, procederemos al reembolso del 100% del valor pagado.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Esta garantía es adicional y no reemplaza los derechos que le corresponden como consumidor
              bajo la Ley 1334/98, incluyendo la garantía legal por vicios ocultos.
            </p>
          </section>

          {/* 7. Devoluciones */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">7. Política de Devoluciones y Reembolsos</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Derecho de arrepentimiento:</strong> De acuerdo con la Ley 1334/98, tiene derecho a
              revocar la compra dentro de los 10 días corridos desde la entrega del producto, sin necesidad
              de expresar causa.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Condiciones para devolución:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>El producto debe estar en su empaque original</li>
              <li>No debe presentar daños causados por mal uso</li>
              <li>Debe incluir todos los accesorios originales</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Proceso de reembolso:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Pagos con tarjeta:</strong> El reembolso se procesará a la misma tarjeta en un plazo de 5-10 días hábiles</li>
              <li><strong>Pagos en efectivo:</strong> Coordinamos transferencia bancaria o retiro en efectivo</li>
            </ul>
          </section>

          {/* 8. Responsabilidades */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">8. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® no será responsable por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Uso incorrecto del producto contrario a las instrucciones proporcionadas</li>
              <li>Daños derivados de modificaciones realizadas al producto</li>
              <li>Retrasos en la entrega por causas de fuerza mayor</li>
              <li>Errores en los datos de entrega proporcionados por el cliente</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Aviso importante:</strong> Los lentes NOCTE® están diseñados para bloquear luz azul
              y mejorar la calidad del sueño. No son un dispositivo médico y no sustituyen el tratamiento
              de trastornos del sueño. Consulte a un profesional de la salud si tiene problemas crónicos de sueño.
            </p>
          </section>

          {/* 9. Propiedad Intelectual */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">9. Propiedad Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos los contenidos del sitio web (textos, imágenes, logotipos, diseños) son propiedad de
              NOCTE® o se utilizan con autorización. Queda prohibida su reproducción, distribución o
              modificación sin autorización expresa por escrito.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® es una marca registrada. Su uso no autorizado constituye una violación de los derechos
              de propiedad intelectual.
            </p>
          </section>

          {/* 10. Protección de Datos */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">10. Protección de Datos Personales</h2>
            <p className="text-muted-foreground leading-relaxed">
              El tratamiento de sus datos personales se rige por nuestra{" "}
              <Link to="/politica-de-privacidad" className="text-primary hover:text-primary/80 underline">
                Política de Privacidad
              </Link>
              , la cual forma parte integral de estos Términos y Condiciones.
            </p>
          </section>

          {/* 11. Modificaciones */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">11. Modificaciones</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOCTE® se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
              Las modificaciones entrarán en vigencia desde su publicación en el sitio web.
              Las compras realizadas antes de la modificación se regirán por los términos vigentes al momento de la compra.
            </p>
          </section>

          {/* 12. Ley Aplicable */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estos Términos y Condiciones se rigen por las leyes de la República del Paraguay.
              Para cualquier controversia derivada de estos términos o de la compra de nuestros productos,
              las partes se someten a la jurisdicción de los tribunales ordinarios de Asunción, Paraguay.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Sin perjuicio de lo anterior, el consumidor podrá recurrir a los mecanismos de defensa del
              consumidor establecidos en la Ley 1334/98 y presentar reclamos ante la{" "}
              <strong>SEDECO (Secretaría de Defensa del Consumidor y el Usuario)</strong>.
            </p>
          </section>

          {/* 13. Contacto */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">13. Contacto y Reclamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para consultas, reclamos o ejercer sus derechos como consumidor:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>WhatsApp:</strong> +595 991 893587</li>
              <li><strong>Instagram:</strong> @noctepy</li>
              <li><strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 18:00</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Nos comprometemos a responder a todos los reclamos en un plazo máximo de 48 horas hábiles.
            </p>
          </section>

          {/* Marco Legal */}
          <section className="mt-12 pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Estos Términos y Condiciones se rigen por la legislación de la República del Paraguay,
              en particular la Ley N° 1334/98 "De Defensa del Consumidor y del Usuario", el Código Civil paraguayo,
              la Ley N° 6534/2020 "De Protección de Datos Personales Crediticios" y demás normativas aplicables.
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

export default TerminosCondiciones;
