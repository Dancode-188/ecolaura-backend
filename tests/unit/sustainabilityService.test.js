const sustainabilityService = require("../../src/services/sustainabilityService");

describe("Sustainability Service", () => {
  test("calculateProductSustainabilityScore returns a number between 0 and 100", () => {
    const product = {
      recycledMaterialPercentage: 50,
      energyEfficiencyRating: 4,
      carbonFootprint: 30,
      sustainablePackaging: true,
      expectedLifespan: 5,
    };
    const score =
      sustainabilityService.calculateProductSustainabilityScore(product);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
