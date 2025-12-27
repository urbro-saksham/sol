import React from "react";

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Paper" },
    { id: 2, label: "Filter" },
    { id: 3, label: "Size" },
    { id: 4, label: "Batch" },
  ];

  return (
    <div className="flex items-center gap-3 mb-3">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`
            px-5 py-1.5 rounded-full text-xs font-semibold transition-all
            ${
              currentStep === step.id
                ? "bg-blue-500 text-white border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "bg-gray-900/80 text-gray-500 border border-gray-700/50"
            }
          `}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;