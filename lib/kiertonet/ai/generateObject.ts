// lib/kiertonet/ai/generateObject.ts
import {
  productMetadataSchema,
  ProductSchema,
  refactoredProductSchema,
} from "@/lib/kiertonet/schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

async function generateProductMetadata(product: z.infer<typeof ProductSchema>) {
  const result = await generateObject({
    model: openai("gpt-4o-2024-08-06", {
      structuredOutputs: true,
    }),
    schemaName: "productMetadata",
    schemaDescription: "Information for improved product listings",
    schema: productMetadataSchema,
    prompt: `
        Analyze the following product information and generate metadata:
        Title: ${product.title}
        Description: ${product.description || "N/A"}
        Faults: ${product.faults || "N/A"}
        Region: ${product.region || "N/A"}
        Price: ${product.price || "N/A"}
  
        Based on this information, provide the metadata as specified in the schema.
      `,
  });
  return result.object;
}

// Todo: Kuvilla ei tehdä mitään tässä vaiheessa. Voimme lisätä ne manuaalisesti myöhemmin. Näin voimme vähentää input propmt kustannuksia.
// export async function refactorProduct(product: PartialInitialProduct) {
//   console.log("Saatu tieto", product);

//   const result = await generateObject({
//     model: openai("gpt-4o-mini", {
//       structuredOutputs: true,
//     }),
//     schemaName: "refactoredProduct",
//     schemaDescription: "Information for product listings",
//     schema: refactoredProductSchema,
//     prompt: `
//     Analysoi seuraavat huonekalun tuotetiedot ja luo yksityiskohtainen strukturoitu tuotekuvaus suomeksi:

//       Title: ${product.title || ""}
//       Description: ${product.description || ""}
//       Faults: ${product.faults || ""}
//       Region: ${product.region || ""}
//       Postal Code: ${product.postal_code || ""}
//       Price: ${product.price || ""}
//       Images: ${product.images || ""}

//     Jos jostakin kentästä ei ole tietoa, jätä se tyhjäksi. Älä keksi tietoja.
//     Muunna mitat (leveys, syvyys, korkeus) senttimetreiksi, jos ne ovat annettu muissa yksiköissä.
//     `,
//   });

//   return result.object;
// }

export async function refactorProduct(product: any, schema?: z.ZodSchema) {
  const usedSchema = schema || refactoredProductSchema;

  const result = await generateObject({
    model: openai("gpt-4o-mini", {
      structuredOutputs: true,
    }),
    schemaName: "refactoredProduct",
    schemaDescription: "Information for product listings",
    schema: usedSchema,
    prompt: `
    Analysoi seuraavat tuotetiedot ja luo yksityiskohtainen strukturoitu tuotekuvaus suomeksi:

    ${Object.entries(product)
      .map(([key, value]) => `${key}: ${value || ""}`)
      .join("\n")}

    Jos jostakin kentästä ei ole tietoa, jätä se tyhjäksi.
    Muunna mitat (leveys, syvyys, korkeus) senttimetreiksi, jos ne ovat annettu muissa yksiköissä.
    category kenttä on esim: "sohva", "tuoli" jne.
    `,
  });

  return result.object;
}

// export async function generateDynamiObject(
//   product: any,
//   dynamicSchema: z.ZodSchema
// ) {
//   console.log("Saatu tieto", product);

//   const result = await generateObject({
//     model: openai("gpt-4o-mini", {
//       structuredOutputs: true,
//     }),
//     schemaName: "refactoredProduct",
//     schemaDescription: "Information for product listings",
//     schema: dynamicSchema, // Käytä dynaamista skeemaa
//     prompt: `
//     Analysoi seuraavat tuotetiedot ja luo yksityiskohtainen strukturoitu tuotekuvaus suomeksi:

//     ${Object.entries(product)
//       .map(([key, value]) => `${key}: ${value || ""}`)
//       .join("\n")}

//     Jos jostakin kentästä ei ole tietoa, jätä se tyhjäksi. Älä keksi tietoja.
//     Muunna mitat (leveys, syvyys, korkeus) senttimetreiksi, jos ne ovat annettu muissa yksiköissä.
//     `,
//   });

//   return result.object;
// }
