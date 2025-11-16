import { motion } from 'framer-motion';
import { MapPinIcon, UserIcon, CreditCardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CheckoutProgressBarProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { id: 1, name: 'Ubicación', icon: MapPinIcon },
  { id: 2, name: 'Información', icon: UserIcon },
  { id: 3, name: 'Pago', icon: CreditCardIcon },
];

export const CheckoutProgressBar = ({ currentStep }: CheckoutProgressBarProps) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Progress Bar */}
      <div className="relative">
        {/* Background Bar */}
        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
          {/* Active Progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          />
        </div>

        {/* Step Indicators */}
        <div className="absolute -top-1 left-0 w-full flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center"
                style={{
                  marginLeft: step.id === 1 ? '0' : '-12px',
                  marginRight: step.id === steps.length ? '0' : '-12px',
                }}
              >
                {/* Circle */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary border-primary'
                      : isCurrent
                      ? 'bg-primary border-primary shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                      : 'bg-secondary border-border'
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" strokeWidth={3} />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        isCurrent ? 'text-white' : 'text-muted-foreground'
                      }`}
                      strokeWidth={2}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <p
                  className={`mt-2 text-xs font-medium transition-colors ${
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Percentage */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Paso {currentStep} de {steps.length}
          <span className="ml-2 text-primary font-semibold">
            ({Math.round((currentStep / steps.length) * 100)}% completado)
          </span>
        </p>
      </div>
    </div>
  );
};
