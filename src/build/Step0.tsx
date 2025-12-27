import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Header from "./Header";

interface Step0Props {
  step: number;
  nextStep: () => void;
}

const Step0: React.FC<Step0Props> = ({ step, nextStep }) => {
  return (
    <section className="w-full flex justify-center">
      <div className="w-[90%] max-w-[1200px] mt-[5%] mb-[1%]">
        {/* Hero */}
        <div className="text-center space-y-4 mb-[8%]">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Create your cone exactly the way you{" "}
            <span className="text-blue-400">want it.</span>
          </h1>

          <p className="mx-auto max-w-[55%] text-sm text-gray-300 leading-relaxed">
            Dive into a world of endless possibilities. Select the perfect paper
            for your custom cones and begin crafting your unique smoking
            experience.
          </p>
        </div>

        {/* Cards + Steps */}
        <div className="relative mt-[6%]">
          {/* Steps (attached to cards) */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[85%] z-10">
            <Header step={step} />
          </div>

          {/* Cards */}
          <div className="flex justify-center pt-3">
            <div className="grid grid-cols-4 gap-[3%] w-full max-w-[1100px]">
              {[
                {
                  src: "/build/0-1.png",
                  heading: "Select your cone paper",
                  label:
                    "Choose from a variety of material and texture for your cone.",
                },
                {
                  src: "/build/0-2.png",
                  heading: "Select your filter / tip",
                  label:
                    "Personalize the filter for enhanced airflow and experience.",
                },
                {
                  src: "/build/0-3.png",
                  heading: "Select your cone size",
                  label:
                    "Determine the perfect dimensions for your custom cone.",
                },
                {
                  src: "/build/0-4.png",
                  heading: "Select your paper quantity",
                  label:
                    "Add a unique touch with custom branding and sealing options.",
                },
              ].map((card) => (
                <div
                  key={card.src}
                  className="w-[239px] mx-auto rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl flex flex-col shadow-[0_0_22px_rgba(59,130,246,0.18)]"
                >
                  {/* Image */}
                  <div className="relative w-full h-[150px]">
                    <Image
                      src={card.src}
                      alt={card.heading}
                      fill
                      className="object-cover p-2 rounded-3xl"
                      priority
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center text-center px-4 py-5 space-y-3">
                    {/* One-line heading */}
                    <p className="text-sm font-semibold text-gray-100 truncate w-full">
                      {card.heading}
                    </p>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      {card.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-[5%]">
          <Button
            onClick={nextStep}
            className="btn-liquid px-10 w-[28%] py-6 text-[10px] font-bold uppercase tracking-[0.25em] text-white rounded-full border border-blue-500 bg-blue-600/80 hover:bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.7)]"
          >
            START TO BUILD YOUR CONE
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Step0;