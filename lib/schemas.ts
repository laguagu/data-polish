import { z } from "zod";

export const furnitureMetadataSchema = z.object({
  style: z.string(),
  usage: z.string(),
  features: z.array(z.string()),
  comfortLevel: z.string(),
  suitableRooms: z.array(z.string()),
  description: z.string().describe("Huonekalun kuvaus"),
});
export const FurnitureEstimate = z
  .object({
    name: z.string().describe("The full name of the furniture piece"),
    brand: z.string().describe("The brand of the furniture"),
    model: z.string().describe("The specific model of the furniture"),
    type: z
      .string()
      .describe("The type of furniture (e.g., chair, table, sofa)"),
    material: z
      .string()
      .describe("The primary material(s) used in the furniture"),
    condition: z.string().describe("The current condition of the furniture"),
    estimatedPriceRange: z
      .object({
        min: z.number().describe("The minimum estimated price in Euros"),
        max: z.number().describe("The maximum estimated price in Euros"),
      })
      .describe(
        "The estimated price range for the furniture in the Finnish market",
      ),
    description: z
      .string()
      .describe(
        "A brief description of the furniture, including its key features and characteristics",
      ),
    marketContext: z
      .string()
      .describe(
        "Information about the current market for this type of furniture in Finland, including trends and demand",
      ),
    valueFactors: z
      .array(z.string())
      .describe("Factors that affect the value of this furniture piece"),
    recommendations: z
      .array(z.string())
      .describe(
        "Recommendations for potential buyers or sellers of this furniture in Finland",
      ),
  })
  .describe(
    "Analyze the provided information about a piece of furniture and create a structured output. Focus on the Finnish market and current trends in Finnish furniture pricing.",
  );

export type FurnitureEstimateType = z.infer<typeof FurnitureEstimate>;
export type FurnitureMetadata = z.infer<typeof furnitureMetadataSchema>;
