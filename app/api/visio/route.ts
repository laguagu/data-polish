import {
  analyzeImage,
  generateFinalAnalysis,
  getSimilarFurniture,
} from "@/lib/ai/index";
import { FurnitureDetails } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const llmModel = openai("gpt-4o-2024-08-06");
/*
Generate embedding for furniture details and find similar furniture
If you have a large dataset, you can use a more advanced method like FAISS for similarity search
Add form values to the embedding text
*/

export async function POST(req: NextRequest) {
  try {
    /* 
      TODO: Tarkista että kaikkia lomakenttiä käytetään. Tällä hetkellä esim tietokannassa ei ole formdatassa olevaa
      model kenttää ollenkaa. Vaihda muutenkin lomake mieluusti reactHookFormiin ja käytä sitä lomakkeen käsittelyssä.
    */
    console.log("kutsuttu");

    const { image, furnitureDetails } = await parseFormData(req);
    console.log("Furniture Details::", furnitureDetails);
    const imageAnalysisResult = await analyzeImage(image);
    console.log("Picture analyzed");
    console.log("Finding similar furniture from database");
    const similarFurniture = await getSimilarFurniture(furnitureDetails);
    console.log("Similar furniture from database RAG::", similarFurniture);
    console.log("Generating final analysis");
    const finalAnalysis = await generateFinalAnalysis(
      imageAnalysisResult,
      similarFurniture,
      furnitureDetails,
    );

    return NextResponse.json({
      analysisText: imageAnalysisResult,
      similarFurniture,
      finalAnalysis,
      bestMatchImageUrl: similarFurniture[0]?.image_url,
    });
  } catch (error) {
    console.error("Error in furniture analysis:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during analysis",
      },
      { status: 500 },
    );
  }
}

async function parseFormData(
  req: NextRequest,
): Promise<{ image: File; furnitureDetails: FurnitureDetails }> {
  const formData = await req.formData();
  const image = formData.get("image") as File | null;
  const furnitureDetailsString = formData.get("furniture_details") as
    | string
    | null;

  if (!image || !furnitureDetailsString) {
    throw new Error("Missing required fields");
  }

  return {
    image,
    furnitureDetails: JSON.parse(furnitureDetailsString),
  };
}
