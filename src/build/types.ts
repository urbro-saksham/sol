import React from "react";
import {
  Leaf,
  Droplets,
  Infinity,
  ChevronsDown,
  Sparkle,
  Flower2,
  Star,
  PanelsTopLeft,
  CupSoda,
  GlassWater,
  TreePine,
  Circle,
} from "lucide-react";

export type PaperType = "unbleached" | "hemp" | "bleached" | "colored" | "rice" | "bamboo";
export type FilterType = "folded" | "spiral" | "ceramic" | "glass" | "wooden" | "ball";
export type ConeSize = "70mm" | "84mm" | "98mm" | "109mm";
export type LotSize = "sample" | "small" | "medium" | "large" |"mega" |"bulk" | "custom";

export interface CustomizationState {
  paperType: PaperType | null;
  filterType: FilterType | null;
  coneSize: ConeSize | null;
  lotSize: LotSize | null;
  paperColorHex?: string | null;
  filterColorHex?: string | null;
  paperTextureUrl?: string | null;
  filterTextureUrl?: string | null;
  customQuantity: string;
  country: string;
  zipCode: string;
}

export const PAPER_TYPES = [
  {
    id: "unbleached" as PaperType,
    name: "Unbleached (Brown)",
    description: "Natural and organic, for a pure experience.",
  },
  {
    id: "hemp" as PaperType,
    name: "Hemp Paper",
    description: "Sustainable choice, with a unique texture.",
  },
  {
    id: "bleached" as PaperType,
    name: "Bleached (White)",
    description: "Clean and classic, for a smooth burn.",
  },
  {
    id: "colored" as PaperType,
    name: "Colored Paper",
    description: "Vibrant colors with smooth texture.",
  },
  {
    id: "rice" as PaperType,
    name: "Rice Paper",
    description: "Ultra-thin and refined, nearly transparent.",
  },
  {
    id: "bamboo" as PaperType,
    name: "Bamboo Paper",
    description: "All-natural organic bamboo with unique texture.",
  },
];

export const FILTER_TYPES = [
  {
    id: "folded" as FilterType,
    name: "Folded",
    description:
      "Classic folded paper tip with crisp edges and structural support.",
    icon: PanelsTopLeft,
  },
  {
    id: "spiral" as FilterType,
    name: "Spiral",
    description:
      "Rolled spiral paper for a smooth draw and distinctive visual twist.",
    icon: Infinity,
  },
  {
    id: "ceramic" as FilterType,
    name: "Ceramic",
    description: "Premium ceramic-style tip with a clean, refined finish.",
    icon: CupSoda,
  },
  {
    id: "glass" as FilterType,
    name: "Glass",
    description: "Crystal-clear glass-inspired tip with a modern feel.",
    icon: GlassWater,
  },
  {
    id: "wooden" as FilterType,
    name: "Wooden",
    description: "Natural wooden filter with authentic wood grain texture.",
    icon: TreePine,
  },
  {
    id: "ball" as FilterType,
    name: "Ball",
    description: "Cylindrical filter with decorative ball on top.",
    icon: Circle,
  },
];

// Cone dimensions in mm (from image reference)
export const CONE_DIMENSIONS: Record<ConeSize, { topDiameter: number; bottomDiameter: number; height: number }> = {
  "70mm": { topDiameter: 9.9, bottomDiameter: 5.5, height: 70 },
  "84mm": { topDiameter: 10.8, bottomDiameter: 5.5, height: 84 },
  "98mm": { topDiameter: 11.7, bottomDiameter: 5.5, height: 98 },
  "109mm": { topDiameter: 12.4, bottomDiameter: 5.5, height: 109 },
};

export const CONE_SIZES = [
  {
    id: "70mm" as ConeSize,
    name: "70mm",
    description: "Dogwalk / Mini",
  },
  {
    id: "84mm" as ConeSize,
    name: "84mm",
    description: "1/2 Gram",
  },
  {
    id: "98mm" as ConeSize,
    name: "98mm",
    description: "Standard / 3/4 Gram",
  },
  {
    id: "109mm" as ConeSize,
    name: "109mm",
    description: "King Size 1 Gram",
  },
  {
    id: "100mm" as ConeSize,
    name: "98mm",
    description: "Standard / 3/4 Gram",
  },
  {
    id: "119mm" as ConeSize,
    name: "109mm",
    description: "King Size 1 Gram",
  },
];

export const LOT_SIZES = [
  {
    id: "sample" as LotSize,
    name: "Sample Batch",
    quantity: "50-200 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
  {
    id: "small" as LotSize,
    name: "Small Batch",
    quantity: "3,000-10,000 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
  {
    id: "medium" as LotSize,
    name: "Medium Run",
    quantity: "50-200 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
  {
    id: "large" as LotSize,
    name: "Large Scale",
    quantity: "50-200 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
  {
    id: "Mega" as LotSize,
    name: "Sample Batch",
    quantity: "50-200 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
  {
    id: "Bulk" as LotSize,
    name: "Small Batch",
    quantity: "3,000-10,000 cones",
    leadTime: "5-7 Business Days",
    price: "$0.40 - $0.75 per cone",
  },
];

export const getPaperTypeName = (paperType: PaperType | null): string => {
  const paper = PAPER_TYPES.find((p) => p.id === paperType);
  return paper?.name || "Select Paper";
};

export const getFilterTypeName = (filterType: FilterType | null): string => {
  const filter = FILTER_TYPES.find((f) => f.id === filterType);
  return filter?.name || "Select Filter";
};

export const getConeSizeName = (coneSize: ConeSize | null): string => {
  if (!coneSize) return "Choose Size";
  const size = CONE_SIZES.find((s) => s.id === coneSize);
  return `${size?.id}${size?.description ? ` (${size.description})` : ""}`;
};

export const getLotSizeName = (
  lotSize: LotSize | null,
  customQuantity: string
): string => {
  if (!lotSize) return "Choose Lot Size";
  if (lotSize === "custom")
    return `Custom (${customQuantity || "Enter quantity"})`;
  const lot = LOT_SIZES.find((l) => l.id === lotSize);
  return `${lot?.name} (${lot?.quantity})`;
};

// Quantity and pricing helpers
export const getQuantity = (state: CustomizationState): number => {
  if (state.lotSize === "custom") {
    const qty = parseInt(state.customQuantity) || 0;
    return qty > 0 ? qty : 0;
  }

  switch (state.lotSize) {
    case "sample":
      return 125; // Average of 50-200
    case "small":
      return 6500; // Average of 3,000-10,000
    case "medium":
      return 50000; // Estimate
    case "large":
      return 100000; // Estimate
    default:
      return 0;
  }
};

export const getPricePerCone = (state: CustomizationState): number => {
  const quantity = getQuantity(state);
  // Lower price per cone for larger quantities
  if (quantity >= 100000) return 0.4;
  if (quantity >= 50000) return 0.45;
  if (quantity >= 10000) return 0.5;
  if (quantity >= 5000) return 0.55;
  if (quantity >= 1000) return 0.6;
  if (quantity >= 200) return 0.65;
  return 0.75; // For sample batches
};

export const getTotalPriceNumber = (state: CustomizationState): number => {
  const quantity = getQuantity(state);
  const pricePerCone = getPricePerCone(state);
  return quantity * pricePerCone;
};

export const getTotalPrice = (state: CustomizationState): string => {
  const total = getTotalPriceNumber(state);
  return `$${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


