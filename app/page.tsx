"use client";

import React, { useState } from "react";
// import { useCart } from "@/src/contexts/CartContext";
import { toast } from "sonner";
import Step0 from "@/src/build/Step0";
import Step1 from "@/src/build/Step1";
import Step2 from "@/src/build/Step2";
import Step3 from "@/src/build/Step3";
import Step4 from "@/src/build/step4";
import {
  type CustomizationState,
  getLotSizeName,
  getConeSizeName,
  getFilterTypeName,
  getPaperTypeName,
  getQuantity,
  getTotalPrice,
  getTotalPriceNumber,
} from "@/src/build/types";

export default function BuildPage() {
  // const { addItem } = useCart();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<CustomizationState>({
    paperType: "hemp", // Default to Hemp Paper as shown in image
    filterType: "folded",
    coneSize: null,
    lotSize: null,
    paperColorHex: null,
    filterColorHex: null,
    paperTextureUrl: null,
    filterTextureUrl: null,
    customQuantity: "",
    country: "",
    zipCode: "",
  });

  const updateState = (updates: Partial<CustomizationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleAddToCart = () => {
    if (!state.paperType || !state.filterType || !state.coneSize || !state.lotSize) {
      toast.error("Complete customization first", {
        description: "Please finish all steps before adding to cart.",
      });
      return; // Don't add if required fields are missing
    }

    const quantity = getQuantity(state);
    const totalPrice = getTotalPriceNumber(state); // Total price for the lot

    // Generate unique ID based on customization
    const itemId = `custom-${state.paperType}-${state.filterType}-${state.coneSize}-${state.lotSize}-${crypto.randomUUID()}`;

    // Create descriptive name with all customization details
    const itemName = `Custom Cone - ${getPaperTypeName(state.paperType)}, ${getFilterTypeName(
      state.filterType
    )}, ${getConeSizeName(state.coneSize)}, ${getLotSizeName(
      state.lotSize,
      state.customQuantity
    )}`;

    // Create cart item
    const cartItem = {
      id: itemId,
      name: itemName,
      paperType: getPaperTypeName(state.paperType),
      quantity: 1, // This represents 1 "lot" in the cart
      price: totalPrice, // Total price for this lot
      image: "/homepage/conestack.png", // Default image
    };

    // addItem(cartItem);

    // Show success message
    toast.success("Custom cone added to cart", {
      description: `${quantity.toLocaleString()} cones • ${getTotalPrice(
        state
      )}`,
    });
    
    // Optionally redirect to catalog
    // router.push("/catalog");
  };

  // Show bottom preview for steps 1-4
  const showBottomPreview = step >= 1 && step <= 4;

  return (
    <div className="min-h-screen font-[Manrope]">
      <main className="pt-16 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Step 0: Intro / Overview */}
          {step === 0 && <Step0 step={step} nextStep={nextStep} />}

          {/* Step 1: Paper Type Selection */}
          {step === 1 && (
            <Step1
              step={step}
              state={state}
              updateState={updateState}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {/* Step 2: Filter/Tip Selection */}
          {step === 2 && (
            <Step2
              step={step}
              state={state}
              updateState={updateState}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {/* Step 3: Cone Size Selection */}
          {step === 3 && (
            <Step3
              step={step}
              state={state}
              updateState={updateState}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {/* Step 4: Lot Size Selection */}
          {step === 4 && (
            <Step4
              step={step}
              state={state}
              updateState={updateState}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {/* Step 5: Location/Shipping */}
          {/* {step === 5 && (
            <Checkout
              state={state}
              updateState={updateState}
              prevStep={prevStep}
              handleAddToCart={handleAddToCart}
            />
          )} */}

        </div>
      </main>
    </div>
  );
}
