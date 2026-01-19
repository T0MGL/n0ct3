import { motion } from "framer-motion";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import robertDowney from "@/assets/Robert-Downey-Jr-Glasses-5.jpg";
import lewisHamilton from "@/assets/lewis-hamilton-great-britain-mercedes-955639803.png";
import cbum from "@/assets/cbum.jpeg";
import selenaGomez from "@/assets/selena-gomez-sunglasses-tint-bb13-2017-billboard-1548.jpeg";
import tomHolland from "@/assets/tumblr_880f0d056d244f576f1dc8c30b9fab6e_16c94225_1280.jpg";
import erlingHaaland from "@/assets/WhatsApp_Image_2025-04-13_at_17.40.59.jpg";

const celebrities = [
    {
        name: "Erling Haaland",
        role: "Futbolista profesional",
        image: erlingHaaland,
    },
    {
        name: "Robert Downey Jr",
        role: "Actor",
        image: robertDowney,
    },
    {
        name: "Chris Bumstead",
        role: "Fisicoculturista",
        image: cbum,
    },
    {
        name: "Tom Holland",
        role: "Actor",
        image: tomHolland,
    },
    {
        name: "Lewis Hamilton",
        role: "Piloto de F1",
        image: lewisHamilton,
    },
    {
        name: "Selena Gomez",
        role: "Cantante",
        image: selenaGomez,
    },
];

export const CelebritiesMarquee = () => {
    return (
        <section className="py-12 md:py-20 bg-black overflow-hidden">
            <div className="container max-w-[1400px] mx-auto px-4">
                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 text-white"
                >
                    CUANDO ALGO FUNCIONA, SE NOTA...
                </motion.h2>

                {/* Infinite Marquee */}
                <div className="relative">
                    {/* Gradient overlays for smooth fade */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none" />

                    {/* Marquee container */}
                    <div className="flex overflow-hidden">
                        {/* Create seamless infinite loop - render celebrities 3 times */}
                        {[0, 1, 2].map((setIndex) => (
                            <motion.div
                                key={setIndex}
                                className="flex flex-shrink-0 gap-8 md:gap-16 lg:gap-24"
                                initial={{ x: "0%" }}
                                animate={{ x: "-100%" }}
                                transition={{
                                    x: {
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        duration: 50,
                                        ease: "linear",
                                    },
                                }}
                                style={{ willChange: "transform" }}
                            >
                                {celebrities.map((celebrity, index) => (
                                    <div
                                        key={`${setIndex}-${index}`}
                                        className="flex flex-col items-center gap-3 min-w-[120px] md:min-w-[140px]"
                                    >
                                        {/* Avatar with verified badge */}
                                        <div className="relative">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 bg-card">
                                                <img
                                                    src={celebrity.image}
                                                    alt={celebrity.name}
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            </div>
                                            {/* Verified badge */}
                                            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                                                <CheckBadgeIcon className="w-5 h-5 md:w-6 md:h-6 text-[#1DA1F2]" />
                                            </div>
                                        </div>

                                        {/* Name and role */}
                                        <div className="text-center">
                                            <p className="text-white font-semibold text-sm md:text-base whitespace-nowrap">
                                                {celebrity.name}
                                            </p>
                                            <p className="text-[#1DA1F2] text-xs md:text-sm whitespace-nowrap">
                                                {celebrity.role}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Subtle trust indicator */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="text-center mt-12 md:mt-16 text-sm md:text-base text-white/50 font-light tracking-wide"
                >
                    Confiado por profesionales y celebridades alrededor del mundo
                </motion.p>
            </div>
        </section>
    );
};

export default CelebritiesMarquee;
