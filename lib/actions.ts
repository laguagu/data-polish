"use server";

import {
  analyzeImage,
  generateFinalAnalysis,
  getSimilarFurniture,
} from "@/lib/ai/index";
import { FurnitureDetails } from "@/lib/types";

export async function analyzeFurniture(formData: FormData) {
  try {
    const image = formData.get("image") as File;

    const furnitureDetails: FurnitureDetails = {
      brand: formData.get("brand") as string,
      type: formData.get("type") as string,
      material: formData.get("material") as string,
    };

    const imageAnalysisResult = await analyzeImage(image);
    const similarFurniture = await getSimilarFurniture(furnitureDetails);
    const finalAnalysis = await generateFinalAnalysis(
      imageAnalysisResult,
      similarFurniture,
      furnitureDetails,
    );

    return {
      finalAnalysis,
      bestMatchImageUrl: similarFurniture[0]?.image_url,
    };
  } catch (error) {
    console.error("Error in furniture analysis:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during analysis",
    };
  }
}
