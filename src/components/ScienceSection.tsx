import { motion } from "framer-motion";

export const ScienceSection = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />

      <div className="container max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16 md:mb-20 space-y-6 md:space-y-8"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter px-4 leading-tight">
            Por qué los lentes rojos, no transparentes.
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light max-w-4xl mx-auto px-4 leading-relaxed">
            Los lentes "anti-luz azul" transparentes bloquean apenas el 20-30%. <span className="text-foreground font-medium">No es suficiente.</span> Los lentes rojos de NOCTE bloquean el 99% del espectro 400-550nm—la luz que literalmente le grita a tu cerebro "¡despierta!" mientras trabajas de noche. Úsalos durante tus sesiones nocturnas, y tu cuerpo producirá melatonina como si fuera de noche... porque para tu cerebro, lo es.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative"
        >
          {/* Desktop/Tablet: Side by side comparison */}
          <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Without Glasses */}
            <div className="space-y-6">
              <div className="bg-card/50 border border-border/50 p-6 lg:p-8">
                <h3 className="text-xl lg:text-2xl font-bold mb-6 text-center">Sin Lentes</h3>
                <div className="relative h-64 lg:h-80">
                  {/* Blue light wave - Full spectrum */}
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Grid background */}
                    <line x1="0" y1="260" x2="400" y2="260" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

                    {/* Blue light curve (400-500nm) - HIGH */}
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 50 260 Q 100 20 150 260"
                      fill="url(#blueGradient)"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                    />

                    {/* Other light spectrum */}
                    <defs>
                      <linearGradient id="spectrumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                        <stop offset="50%" stopColor="rgba(234, 179, 8, 0.3)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 150 260 Q 200 120 250 260 Q 300 140 350 260"
                      fill="url(#spectrumGradient)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />

                    {/* Wavelength labels */}
                    <text x="100" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">400nm</text>
                    <text x="200" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">500nm</text>
                    <text x="300" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">600nm</text>

                    {/* Y-axis label */}
                    <text x="10" y="30" fill="rgba(255,255,255,0.5)" fontSize="11">100</text>
                    <text x="10" y="270" fill="rgba(255,255,255,0.5)" fontSize="11">0</text>
                  </svg>
                </div>
                <p className="text-sm text-center text-primary font-semibold mt-4">
                  Luz azul al 100% = Cerebro en modo día
                </p>
              </div>
            </div>

            {/* With Glasses */}
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/50 p-6 lg:p-8">
                <h3 className="text-xl lg:text-2xl font-bold mb-6 text-center text-primary">Con NOCTE</h3>
                <div className="relative h-64 lg:h-80">
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Grid background */}
                    <line x1="0" y1="260" x2="400" y2="260" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

                    {/* Blue light curve - BLOCKED (minimal) */}
                    <path
                      d="M 50 260 Q 100 250 150 260"
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />

                    {/* Other light spectrum - passes through */}
                    <path
                      d="M 150 260 Q 200 120 250 260 Q 300 140 350 260"
                      fill="url(#spectrumGradient)"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />

                    {/* Block indicator */}
                    <line x1="50" y1="240" x2="150" y2="240" stroke="rgb(239, 68, 68)" strokeWidth="3"/>
                    <text x="100" y="235" fill="rgb(239, 68, 68)" fontSize="12" textAnchor="middle" fontWeight="bold">BLOQUEADO 99%</text>

                    {/* Wavelength labels */}
                    <text x="100" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">400nm</text>
                    <text x="200" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">500nm</text>
                    <text x="300" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="middle">600nm</text>

                    {/* Y-axis label */}
                    <text x="10" y="30" fill="rgba(255,255,255,0.5)" fontSize="11">100</text>
                    <text x="10" y="270" fill="rgba(255,255,255,0.5)" fontSize="11">0</text>
                  </svg>
                </div>
                <p className="text-sm text-center text-primary font-semibold mt-4">
                  99% bloqueado = Tu cerebro puede descansar
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Before/After slider simulation */}
          <div className="md:hidden space-y-10">
            <div className="bg-card/50 border border-border/50 p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Sin Lentes</h3>
              <div className="relative h-72">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  {/* Grid */}
                  <line x1="0" y1="260" x2="400" y2="260" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>

                  {/* Blue light - HIGH */}
                  <path
                    d="M 50 260 Q 100 20 150 260"
                    fill="url(#blueGradient)"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="3"
                  />
                  <path
                    d="M 150 260 Q 200 120 250 260 Q 300 140 350 260"
                    fill="url(#spectrumGradient)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                  />
                  <text x="100" y="290" fill="rgba(255,255,255,0.7)" fontSize="14" textAnchor="middle" fontWeight="bold">400nm</text>
                  <text x="300" y="290" fill="rgba(255,255,255,0.7)" fontSize="14" textAnchor="middle" fontWeight="bold">600nm</text>

                  {/* Y-axis labels */}
                  <text x="20" y="30" fill="rgba(255,255,255,0.5)" fontSize="13">100</text>
                  <text x="20" y="270" fill="rgba(255,255,255,0.5)" fontSize="13">0</text>
                </svg>
              </div>
              <p className="text-base text-center text-primary font-bold mt-6 leading-relaxed">
                Luz azul 100%<br/>
                <span className="text-sm text-muted-foreground font-normal">Tu cerebro piensa que es de día</span>
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/50 p-8">
              <h3 className="text-2xl font-bold mb-6 text-center text-primary">Con NOCTE</h3>
              <div className="relative h-72">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  {/* Grid */}
                  <line x1="0" y1="260" x2="400" y2="260" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>

                  {/* Blue light - BLOCKED */}
                  <path
                    d="M 50 260 Q 100 250 150 260"
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="3"
                    strokeDasharray="6,6"
                  />
                  <path
                    d="M 150 260 Q 200 120 250 260 Q 300 140 350 260"
                    fill="url(#spectrumGradient)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                  />
                  <line x1="50" y1="230" x2="150" y2="230" stroke="rgb(239, 68, 68)" strokeWidth="4"/>
                  <text x="100" y="220" fill="rgb(239, 68, 68)" fontSize="14" textAnchor="middle" fontWeight="bold">99% BLOQUEADO</text>
                  <text x="100" y="290" fill="rgba(255,255,255,0.7)" fontSize="14" textAnchor="middle" fontWeight="bold">400nm</text>
                  <text x="300" y="290" fill="rgba(255,255,255,0.7)" fontSize="14" textAnchor="middle" fontWeight="bold">600nm</text>

                  {/* Y-axis labels */}
                  <text x="20" y="30" fill="rgba(255,255,255,0.5)" fontSize="13">100</text>
                  <text x="20" y="270" fill="rgba(255,255,255,0.5)" fontSize="13">0</text>
                </svg>
              </div>
              <p className="text-base text-center text-primary font-bold mt-6 leading-relaxed">
                99% bloqueado<br/>
                <span className="text-sm text-foreground/80 font-normal">Tu cerebro puede prepararse para dormir</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom explanation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-12 md:mt-16 text-center"
        >
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
            Longitud de onda (nm) - La luz azul entre 400-500nm es la que más afecta tu sueño.
            Los lentes rojos NOCTE bloquean el 99% de este rango crítico.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ScienceSection;
