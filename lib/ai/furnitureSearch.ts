// lib/furnitureSearch.ts
import { generateEmbedding } from "@/lib/ai/create-embeddings";
import { supabase } from "@/lib/db/supabase";
import { FurnitureDetails } from "../types";

// TODO: Lisää tähän malli niinkuin tietokanta tietoihinkin. Tällä hetkellä puuttuu
function createEmbeddingText(furnitureDetails: FurnitureDetails): string {
  return `
    Tyyppi: ${furnitureDetails.type}
    Merkki: ${furnitureDetails.brand}
    Materiaali: ${furnitureDetails.material}
    Kuvaus: ${furnitureDetails.description}
  `.trim();
}

async function fetchSimilarFurniture(
  embedding: number[],
  description: string,
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("match_furniture", {
      query_embedding: embedding,
      query_description: description,
      match_threshold: 0.1,
      match_count: 3,
    });

    if (error) {
      console.error("Error in match_furniture RPC:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching similar furniture:", error);
    return [];
  }
}

export async function getSimilarFurniture(
  furnitureDetails: FurnitureDetails,
): Promise<any[]> {
  const embeddingText = createEmbeddingText(furnitureDetails);
  const embedding = await generateEmbedding(embeddingText);
  return await fetchSimilarFurniture(embedding, embeddingText);
}
