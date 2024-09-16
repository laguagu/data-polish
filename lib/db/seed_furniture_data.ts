import "@/lib/envConfig";
import axios from "axios";
import * as cheerio from "cheerio";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { supabase } from "./supabase";
import { z } from "zod";
import { generateEmbedding } from "@/lib/ai/create-embeddings";
import { FurnitureDetails } from "../types";

export const furnitureMetadataSchema = z.object({
  style: z.string(),
  usage: z.string(),
  features: z.array(z.string()),
  comfortLevel: z.string(),
  suitableRooms: z.array(z.string()),
  description: z.string().describe("Huonekalun kuvaus"),
});

export type FurnitureMetadata = z.infer<typeof furnitureMetadataSchema>;

const materials = ["Puu", "Metalli", "Muovi", "Kangas"];

async function scrapeIskuFurniture(): Promise<FurnitureDetails[]> {
  const url = "https://isku.fi/collections/tuolit";
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const furnitureItems: FurnitureDetails[] = [];

  $("#ProductGridContainer #product-grid .grid__item").each(
    (index, element) => {
      if (index >= 5) return false; // Stop after 5 items

      const $element = $(element);
      const $cardContent = $element.find(".card__content");

      // Get the name from the correct element
      const name =
        $element.find(".full-unstyled-link").text().trim() ||
        "Tuntematon tuoli";

      const priceText = $cardContent
        .find(".price__container .price-item--regular")
        .text()
        .trim();
      const price = priceText
        ? parseFloat(priceText.replace("€", "").replace(",", "."))
        : null;

      const vendorText = $cardContent.find(".card-vendor").text().trim();
      const vendor = vendorText.replace("Myyjä:", "").trim() || "Tuntematon";

      // Get the image URL from srcset
      const srcset = $element
        .find(".card__media .media--transparent img")
        .attr("srcset");
      let imageUrl = "";
      if (srcset) {
        const srcsetParts = srcset.split(",");
        if (srcsetParts.length > 0) {
          // Get the last (usually largest) image URL
          const lastSrcset = srcsetParts[srcsetParts.length - 1]
            .trim()
            .split(" ")[0];
          imageUrl = lastSrcset.startsWith("//")
            ? `https:${lastSrcset}`
            : lastSrcset;
        }
      }

      furnitureItems.push({
        type: "Tuoli",
        brand: vendor,
        material: materials[Math.floor(Math.random() * materials.length)],
        condition: "Uusi",
        price: price || null,
        description: name,
        vendor: vendor,
        image_url: imageUrl,
      });

      console.log(
        `Scraped item: ${name}, Price: ${price || "N/A"}, Vendor: ${vendor}, Image: ${imageUrl}`,
      );
    },
  );

  console.log(`Scraped ${furnitureItems.length} furniture items`);
  return furnitureItems;
}

async function generateFurnitureMetadata(
  furniture: FurnitureDetails,
): Promise<FurnitureMetadata> {
  const prompt = `
  Analysoi seuraavat huonekalutiedot ja generoi metadata:
  Tyyppi: ${furniture.type}
  Merkki: ${furniture.brand}
  Materiaali: ${furniture.material}
  Kuvaus: ${furniture.description}
  Hinta: ${furniture.price}
  Myyjä: ${furniture.vendor}
  
  Anna näiden tietojen perusteella metadata määritellyn skeeman mukaisesti.
  Lisäksi anna yksityiskohtainen kuvaus semanttista hakua varten.
  Käytä suomen kieltä vastauksessasi.
`;

  const result = await generateObject({
    model: openai("gpt-4o-mini", {
      structuredOutputs: true,
    }),
    schemaName: "furnitureMetadata",
    schemaDescription: "Information for semantic search of furniture",
    schema: furnitureMetadataSchema,
    prompt: prompt,
  });
  return result.object;
}

async function processFurniture(furniture: FurnitureDetails) {
  try {
    const metadata = await generateFurnitureMetadata(furniture);
    furniture.description = metadata.description; // Update description with generated text

    const embeddingText = `
    Tyyppi: ${furniture.type}
    Merkki: ${furniture.brand}
    Materiaali: ${furniture.material}
    Tyyli: ${metadata.style}
    Käyttötarkoitus: ${metadata.usage}
    Ominaisuudet: ${metadata.features.join(", ")}
    Mukavuustaso: ${metadata.comfortLevel}
    Sopivat huoneet: ${metadata.suitableRooms.join(", ")}
    Yksityiskohtainen kuvaus: ${metadata.description}
  `.trim();

    const embedding = await generateEmbedding(embeddingText);

    const { data, error } = await supabase.from("furniture").insert({
      ...furniture,
      metadata: metadata,
      embedding: embedding,
    });

    if (error) throw error;
    console.log(`Processed and inserted furniture: ${furniture.description}`);
  } catch (error) {
    console.error(`Failed to process furniture: ${furniture.description}`);
    console.error(error);
  }
}

async function main() {
  try {
    const furnitureData = await scrapeIskuFurniture();
    for (const furniture of furnitureData.slice(0, 5)) {
      await processFurniture(furniture);
    }
    console.log(
      `Processed and seeded ${furnitureData.length} furniture items to the database.`,
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
