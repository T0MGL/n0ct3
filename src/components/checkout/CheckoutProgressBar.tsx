import { motion } from 'framer-motion';

interface CheckoutProgressBarProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { id: 1, name: 'Ubicación' },
  { id: 2, name: 'Datos' },
  { id: 3, name: 'Pago' },
];

export const CheckoutProgressBar = ({ currentStep }: CheckoutProgressBarProps) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-6">
      {/* Steps Labels */}
      <div className="flex justify-between mb-2">
        {steps.map((step) => {
          const isActive = currentStep >= step.id;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-primary' : 'bg-border'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative h-0.5 bg-border/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-y-0 left-0 bg-primary"
        />
      </div>
    </div>
  );
};
