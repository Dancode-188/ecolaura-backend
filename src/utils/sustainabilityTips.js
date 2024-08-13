const tips = [
  "Opt for products with minimal packaging to reduce waste.",
  "Choose products made from recycled materials to promote circular economy.",
  "Look for energy-efficient appliances to reduce your carbon footprint.",
  "Support brands that use renewable energy in their production processes.",
  "Consider the durability of products - longer-lasting items mean less frequent replacements.",
  "Choose products with biodegradable packaging when possible.",
  "Opt for locally-made products to reduce transportation emissions.",
  "Look for certifications like FSC for wood products or GOTS for textiles.",
  "Consider the end-of-life recyclability of products before purchasing.",
  "Choose products with water-saving features to conserve this precious resource.",
];

exports.getRandomTips = (count = 3) => {
  const shuffled = tips.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
