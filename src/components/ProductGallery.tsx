import { useState } from "react";
import heroImage from "@/assets/nocte-product-hero.jpg";
import sideView from "@/assets/nocte-side-view.jpg";
import caseImage from "@/assets/nocte-case.jpg";
import lifestyle from "@/assets/nocte-lifestyle-2.jpg";

const images = [
  { src: heroImage, alt: "NOCTE lentes rojos vista frontal" },
  { src: sideView, alt: "NOCTE lentes rojos vista lateral" },
  { src: caseImage, alt: "NOCTE estuche premium" },
  { src: lifestyle, alt: "NOCTE en uso" },
];

export const ProductGallery = () => {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <section className="py-16 md:py-24 px-4 bg-black">
      <div className="container max-w-[1200px] mx-auto">
        <div className="space-y-8">
          {/* Main Image */}
          <div className="relative aspect-[4/3] md:aspect-video w-full overflow-hidden bg-gradient-to-b from-black via-card/20 to-black">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_60%)]" />
            <img
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              className="w-full h-full object-contain drop-shadow-[0_0_80px_rgba(239,68,68,0.3)]"
            />
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square overflow-hidden bg-card border-2 transition-all duration-300 ${
                  selectedImage === index
                    ? "border-primary shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    : "border-border/30 hover:border-primary/50"
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
