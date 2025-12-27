import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Palette } from "lucide-react";
import { MergeAnimationViewer } from "./ConeMergeAnimtaion";
import { CONE_SIZES, type CustomizationState } from "./types";
import StepIndicator from "./StepIndicator";
import BottomPreview from "./BottomPreview";

interface Step3Props {
  step: number;
  state: CustomizationState;
  updateState: (updates: Partial<CustomizationState>) => void;
  prevStep: () => void;
  nextStep: () => void;
}

const TOTAL_CARDS = 6;

const Step3: React.FC<Step3Props> = ({
  step,
  state,
  updateState,
  prevStep,
  nextStep,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    setTimeout(() => {
      setIsAnimating(false);
      nextStep();
    }, 300);
  };

  // Use only the real CONE_SIZES values; do not fabricate ids.
  const realSizes = CONE_SIZES.slice(0, TOTAL_CARDS);
  const emptySlots = Math.max(0, TOTAL_CARDS - realSizes.length);

  return (
    <div className="space-y-8">
      <div className="mt-11 mb-10 flex justify-center items-center">
        <div className="flex flex-col items-start bg-blue-900/40 border-2 border-blue-400 rounded-4xl px-6 py-3 max-w-md w-[90%] shadow-2xl">
          <div className="flex items-center space-x-2 mb-1">
            <Palette className="text-white w-4.5 h-4.5" />
            <h3 className="text-white font-semibold text-lg">
              Select your Cone Size.
            </h3>
          </div>
          <p className="text-gray-300 text-[12px] w-full truncate whitespace-nowrap overflow-hidden">
            Choose the cone size that fits your design.
          </p>
        </div>
      </div>

      {/* Main layout matches Step1 exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Panel: Animation Viewer */}
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <StepIndicator currentStep={3} />
            <MergeAnimationViewer
              state={state}
              isAnimating={isAnimating}
              onAnimationComplete={handleAnimationComplete}
            />
            {!isAnimating && (
              <div className="absolute bottom-4 left-1/6 transform -translate-x-1/2 flex gap-3 items-center z-10">
                <BottomPreview state={state} type="paper" />
                <BottomPreview state={state} type="filter" />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: 6 Cards, same size/spacing as Step1 */}
        <div className="grid grid-cols-2 gap-4 min-h-[16vh] content-start">
          <div className="col-span-2 mb-0.5">
            <h4 className="text-[110%] text-gray-300 font-medium tracking-wide">
              Available Options
            </h4>
            <div className="h-px w-36 bg-gradient-to-r from-gray-400/40 to-transparent" />
          </div>

          {realSizes.map((size) => {
            const isSelected = state.coneSize === size.id;
            return (
              <button
                key={size.id}
                onClick={() => updateState({ coneSize: size.id })}
                disabled={isAnimating}
                className={`relative h-[115px] rounded-lg p-2.5 border transition-all text-left bg-black/40 backdrop-blur-xl glass-panel ${
                  isSelected
                    ? "active border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.45)]"
                    : "border-gray-700 hover:border-gray-600"
                } ${isAnimating ? "opacity-50 cursor-not-allowed" : ""}`}
                type="button"
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check
                      className="h-5 w-5 text-white font-bold"
                      strokeWidth={3}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center space-y-3 h-full justify-center">
                  <div className="text-center">
                    <div
                      className={`text-white font-semibold text-base mb-1 ${
                        isSelected ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {size.name}
                    </div>
                    <div className="text-gray-400 text-xs leading-snug max-w-[75%] mx-auto">
                      {size.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Empty visual-only cards to make total = 6 (no fake ids or state updates) */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              aria-hidden
              className="h-[115px] rounded-lg p-2.5 border border-dashed border-gray-700 bg-black/20 backdrop-blur-xl opacity-40 pointer-events-none"
            />
          ))}

          {/* Divider + Buttons (same as Step1) */}
          <div className="col-span-2 mt-1">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-500/40 to-transparent mb-2" />

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isAnimating}
                className="btn-glass-panel ml-[2%] cursor-pointer w-30 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!state.coneSize || isAnimating}
                className="btn-glass-panel ml-[2%] not-md:ml-[10%] cursor-pointer w-30 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnimating ? "Merging..." : "NEXT"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;