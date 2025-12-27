import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Download, Palette } from "lucide-react";
import ConeViewer from "./ConeViewer";
import StepIndicator from "./StepIndicator";
import {
  LOT_SIZES,
  type CustomizationState,
} from "./types";

interface Step4Props {
  step: number;
  state: CustomizationState;
  updateState: (updates: Partial<CustomizationState>) => void;
  prevStep: () => void;
  nextStep: () => void;
}

const Step4: React.FC<Step4Props> = ({
  step,
  state,
  updateState,
  prevStep,
  nextStep,
}) => {

  const handleDownload = async () => {
    try {
      const { exportConeToPDF } = await import("@/src/utils/pdfExportClient");
      const canvas = document.querySelector(".w-full.h-full canvas") as HTMLCanvasElement;

      if (!canvas) {
        alert("Canvas not found");
        return;
      }

      await exportConeToPDF(state, canvas);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  // Ensure exactly 6 cards
  const lotOptions = [...LOT_SIZES].slice(0, 6);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="mt-11 mb-10 flex justify-center items-center">
        <div className="flex flex-col items-start bg-blue-900/40 border-2 border-blue-400 rounded-4xl px-6 py-3 max-w-md w-[90%] shadow-2xl">
          <div className="flex items-center space-x-2 mb-1">
            <Palette className="text-white w-5 h-5" />
            <h3 className="text-white font-semibold text-lg">
              Select your Lot Size.
            </h3>
          </div>
          <p className="text-gray-300 text-[12px] w-full truncate whitespace-nowrap overflow-hidden">
            Choose the quantity that fits your order.
          </p>
        </div>
      </div>

      {/* Main layout — SAME AS STEP 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* Left: Preview */}
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <StepIndicator currentStep={4} />
            <ConeViewer state={state} focusStep="lot" />

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="absolute top-0 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:border-blue-400 hover:bg-blue-500/40 transition z-10"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Right: Cards */}
        <div className="grid grid-cols-2 gap-4 min-h-[16vh] content-start">

          <div className="col-span-2 mb-0.5">
            <h4 className="text-[110%] text-gray-300 font-medium tracking-wide">
              Available Options
            </h4>
            <div className="h-px w-36 bg-gradient-to-r from-gray-400/40 to-transparent" />
          </div>

          {lotOptions.map((lot) => {
            const isSelected = state.lotSize === lot.id;

            return (
              <button
                key={lot.id}
                onClick={() => updateState({ lotSize: lot.id })}
                className={`relative h-[115px] rounded-lg p-2.5 border transition-all text-left bg-black/40 backdrop-blur-xl glass-panel ${
                  isSelected
                    ? "active border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.45)]"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                )}

                <div className="flex flex-col justify-center h-full text-center space-y-1">
                  <h3 className="font-semibold text-base text-white">
                    {lot.name}
                  </h3>
                  <p className="text-xs text-gray-400">{lot.quantity}</p>
                  <p className="text-xs text-gray-400">{lot.leadTime}</p>
                  <p className="text-xs font-medium text-gray-300">{lot.price}</p>
                </div>
              </button>
            );
          })}

          {/* Divider + Buttons */}
          <div className="col-span-2 mt-1">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-500/40 to-transparent mb-2" />

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevStep}
                className="btn-glass-panel ml-[2%] w-30 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={nextStep}
                disabled={!state.lotSize}
                className="btn-glass-panel ml-[2%] w-30 text-gray-300 hover:text-white disabled:opacity-50"
              >
                NEXT
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4;
