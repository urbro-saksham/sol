import React from "react";

interface HeaderProps {
  step: number;
}

const Header: React.FC<HeaderProps> = ({ step }) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center w-full max-w-[900px]">
        <StepCircle active={step >= 1} stepNum={1} />
        <Connector active={step >= 2} />
        <StepCircle active={step >= 2} stepNum={2} />
        <Connector active={step >= 3} />
        <StepCircle active={step >= 3} stepNum={3} />
        <Connector active={step >= 4} />
        <StepCircle active={step >= 4} stepNum={4} />
      </div>
    </div>
  );
};

export default Header;

/* ---------- Sub Components ---------- */

const StepCircle = ({
  active,
  stepNum,
}: {
  active: boolean;
  stepNum: number;
}) => (
  <div className="shrink-0 flex items-center justify-center">
    <div
      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center bg-white
        ${active ? "border-blue-600 text-blue-600" : "border-gray-300 text-black"}`}
    >
      <span className="text-sm font-bold">{stepNum}</span>
    </div>
  </div>
);

const Connector = ({ active }: { active: boolean }) => (
  <div
    className={`flex-1 h-[2px] mx-2 ${
      active ? "bg-blue-600" : "bg-gray-300"
    }`}
  />
);