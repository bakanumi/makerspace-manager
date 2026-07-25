export type CalculationInput = {
  deviceWearFactor: number;
  devicePowerConsumptionKw: number;
  timeHours: number;
  laborHours: number;
  hourlyRate: number;
  electricityPrice: number;
  marginPercent: number;
  materialLines: { pricePerUnit: number; amount: number }[];
};

export type CalculationResult = {
  materialCost: number;
  electricityCost: number;
  wearCost: number;
  laborCost: number;
  costPrice: number;
  sellingPrice: number;
  materialLineCosts: number[];
};

export function computeCalculation(input: CalculationInput): CalculationResult {
  const materialLineCosts = input.materialLines.map(
    (line) => line.pricePerUnit * line.amount
  );
  const materialCost = materialLineCosts.reduce((sum, c) => sum + c, 0);
  const electricityCost =
    input.timeHours * input.devicePowerConsumptionKw * input.electricityPrice;
  const wearCost = input.timeHours * input.deviceWearFactor;
  const laborCost = input.laborHours * input.hourlyRate;
  const costPrice = materialCost + electricityCost + wearCost + laborCost;
  const sellingPrice = costPrice * (1 + input.marginPercent / 100);

  return {
    materialCost,
    electricityCost,
    wearCost,
    laborCost,
    costPrice,
    sellingPrice,
    materialLineCosts,
  };
}
