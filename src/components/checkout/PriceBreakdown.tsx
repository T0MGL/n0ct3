export const PriceBreakdown = () => {
  return (
    <div className="mb-8 p-4 bg-secondary border border-border rounded-xl space-y-3">
      {/* Row 1 */}
      <div className="flex justify-between items-center">
        <span className="text-sm md:text-base text-foreground">
          Primera NOCTE<sup className="text-[0.3em]">®</sup> Red Light Blocking Glasses
        </span>
        <span className="text-sm md:text-base text-foreground font-medium">
          320,000 Gs
        </span>
      </div>

      {/* Row 2 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base text-foreground">
            Segunda NOCTE<sup className="text-[0.3em]">®</sup> Red Light Blocking Glasses
          </span>
          <span className="px-2 py-0.5 bg-accent/20 border border-accent/50 rounded text-xs font-bold text-accent">
            -50% OFF
          </span>
        </div>
        <span className="text-sm md:text-base text-[#FF6B6B] font-medium">
          160,000 Gs
        </span>
      </div>

      {/* Separator */}
      <div className="border-t border-border/50" />

      {/* Row 3 - Total */}
      <div className="flex justify-between items-center">
        <span className="text-base md:text-lg text-foreground font-bold">
          Total
        </span>
        <span className="text-base md:text-lg text-foreground font-bold">
          480,000 Gs
        </span>
      </div>

      {/* Savings callout */}
      <div className="pt-2">
        <p className="text-sm text-[#4ADE80] font-semibold text-center">
          Ahorras: 160,000 Gs (33% off)
        </p>
      </div>
    </div>
  );
};
