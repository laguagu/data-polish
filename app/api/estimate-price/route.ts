import { FurnitureEstimate } from "@/lib/schemas";
import { openai as openaiSdk } from "@ai-sdk/openai";
import { Redis } from "@upstash/redis";
import { generateText } from "ai";
import axios from "axios";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
export const dynamic = "force-dynamic";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const redis = Redis.fromEnv();

async function searchSerper(query: string) {
  const response = await axios.post(
    "https://google.serper.dev/search",
    {
      q: query,
      num: 5,
      gl: "fi", // Set country to Finland
      hl: "fi", // Set language to Finnish
    },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
}

async function preprocessSearchResults(searchResponse: string) {
  const prompt = `Analyze the following search results about a piece of furniture:

  ${JSON.stringify(searchResponse, null, 2)}

  Based solely on these search results, provide a concise summary of the following information about the furniture (if available):
  1. Exact models name and brand
  2. Prices or price range (in Euros)
  3. Key features or materials mentioned
  4. Any specific details about its availability or popularity in Finland

  If any of this information is not found in the search results, simply omit it from your response. 
  Do not include any information that is not directly stated in the search results.`;

  const { text } = await generateText({
    model: openaiSdk("gpt-4o-mini"),
    prompt: prompt,
    maxTokens: 150,
  });

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const type = formData.get("type") as string;
    const material = formData.get("material") as string;
    const condition = formData.get("condition") as string;
    const additionalInfo = formData.get("additionalInfo") as string;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 },
      );
    }

    // Convert image to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique hash for the image and form data
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    hash.update(brand + model + type + material + condition + additionalInfo);
    const cacheKey = `furniture:${hash.digest("hex")}`;

    // Check cache
    let cachedResult: unknown = null;
    try {
      cachedResult = await redis.get(cacheKey);
    } catch (error) {
      console.error("Redis error:", error);
    }

    if (cachedResult) {
      console.log("Cache hit");
      return NextResponse.json(cachedResult);
    }

    console.log("Cache miss, processing image...");

    // Convert image to base64 for OpenAI API
    const base64Image = buffer.toString("base64");

    // Analyze image with OpenAI
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify this piece of Finnish furniture. The user provided the following details:

                    Brand: ${brand}
                    Model: ${model}
                    Type: ${type}
                    Material: ${material}
                    Condition: ${condition}
                    Additional Info: ${additionalInfo}

                    Provide a detailed description, including any discrepancies between the image and the provided information. Focus on characteristics that might affect its value in the Finnish market. 
                    
                    If you're not certain about the brand or model, provide your best guess and clearly indicate that it's a guess. For example: "The brand appears to be Artek, but I'm not certain. The model looks similar to Stool 60, but this is my best guess based on the image."

                    Also, if the provided brand or model doesn't match what you see in the image, please note this discrepancy.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const furnitureDescription = analysisResponse.choices[0].message.content;
    console.log("Furniture description:", furnitureDescription);

    // Search for similar furniture using Serper
    const searchResponse = await searchSerper(
      `${furnitureDescription} ${brand} ${model} ${type} ${material} hinta Suomi`,
    );

    console.log("Search response:", searchResponse);
    console.log(
      "Hakutulos joka annetaan OpenAI:lle:",
      JSON.stringify(searchResponse),
    );

    console.log("Search response:", JSON.stringify(searchResponse, null, 2));

    const preprocessedSearchInfo =
      await preprocessSearchResults(searchResponse);

    console.log("Preprocessed search info:", preprocessedSearchInfo);

    // Analyze search results with OpenAI to estimate price and provide details
    const estimationResponse = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content:
            "You are a Finnish furniture pricing expert. Analyze the provided information and search results to create a structured output for the described furniture. Focus on the Finnish market and current trends in Finnish furniture pricing.",
        },
        {
          role: "user",
          content: `Analyze the following information about a piece of furniture:

          Furniture description: ${furnitureDescription}

          Provided details:
          Brand: ${brand}
          Model: ${model}
          Type: ${type}
          Material: ${material}
          Condition: ${condition}
          Additional Info: ${additionalInfo}

          Search results: ${preprocessedSearchInfo}

          Provide a comprehensive analysis based on the given schema.`,
        },
      ],
      response_format: zodResponseFormat(
        FurnitureEstimate,
        "furnitureEstimate",
      ),
    });

    const result = estimationResponse.choices[0].message.parsed;

    // Cache the result as a JSON string
    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 }); // Cache for 1 hour
    } catch (error) {
      console.error("Error caching result:", error);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "Error communicating with OpenAI API" },
        { status: 500 },
      );
    } else if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: "Error communicating with Serper API" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
