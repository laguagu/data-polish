import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  faults: z.string().nullable(),
  region: z.string(),
  postal_code: z.union([z.string(), z.number()]),
  price: z.string(),
  images: z.string(),
});

export const productMetadataSchema = z.object({
  category: z.string(),
  condition: z.string(),
  keywords: z.array(z.string()),
  targetAudience: z.string(),
  sellingPoints: z.array(z.string()),
});

export const refactoredProductSchema = z.object({
  title: z.string().nullable(),
  category: z.string().nullable(),
  material: z.string().nullable(),
  color: z.string().nullable(),
  condition: z.string().nullable(),
  width: z.string().nullable(),
  depth: z.string().nullable(),
  height: z.string().nullable(),
  features: z.string().nullable(), // Tallennetaan pilkulla erotettuna merkkijonona
  brand: z.string().nullable(),
  style: z.string().nullable(),
  assemblyRequired: z.string().nullable(), // "true" tai "false" merkkijonona
  weightCapacity: z.string().nullable(),
  description: z.string().nullable(),
  shortDescription: z
    .string()
    .nullable()
    .describe("Lyhyt kuvaus tuotteesta max 200 merkkiä"),
  faults: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  price: z.string().nullable(), // Tallennetaan merkkijonona numeroiden desimaalierottimien ongelmien välttämiseksi
  deliveryOptions: z.string().nullable(), // Tallennetaan pilkulla erotettuna merkkijonona
  keywords: z.string().nullable(), // Tallennetaan pilkulla erotettuna merkkijonona
  images: z.string().nullable(), // Tallennetaan pilkulla erotettuna merkkijonona
});

export type InitialProduct = z.infer<typeof ProductSchema>;
export type PartialInitialProduct = Partial<InitialProduct>;
export type Product = z.infer<typeof refactoredProductSchema> & { id: string };
export type RefactoredProduct = z.infer<typeof refactoredProductSchema>;
