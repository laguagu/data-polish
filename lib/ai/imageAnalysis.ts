import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import sharp from "sharp";

const llmModel = openai("gpt-4o-2024-08-06");

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

async function validateAndResizeImage(image: File): Promise<Buffer> {
  const format = image.name.split(".").pop()?.toLowerCase();
  if (!format || !ALLOWED_FORMATS.includes(format)) {
    throw new Error(
      `Kuvaformaatti ei ole tuettu. Sallitut formaatit ovat: ${ALLOWED_FORMATS.join(", ")}.`,
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  // Resize the image if it's too large
  const resizedBuffer = await sharp(buffer)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .toFormat("jpeg", { quality: 80 })
    .toBuffer();

  return resizedBuffer;
}

// async function convertToDataUrl(image: File): Promise<string> {
//   const bytes = await image.arrayBuffer();
//   const buffer = Buffer.from(bytes);
//   const base64Image = buffer.toString("base64");
//   return `data:${image.type};base64,${base64Image}`;
// }

async function convertToDataUrl(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const base64Image = buffer.toString("base64");
  return `data:${mimeType};base64,${base64Image}`;
}

export async function analyzeImage(image: File): Promise<string> {
  try {
    const resizedBuffer = await validateAndResizeImage(image);
    console.log("Image validated and resized");

    const dataUrl = await convertToDataUrl(resizedBuffer, image.type);
    console.log("Data URL created");
    const imageAnalysisResult = await generateText({
      model: llmModel,
      system:
        "Olet tekoälyavustaja, joka on erikoistunut huonekalujen analysointiin. Analysoi ladattu huonekalukuva ja anna yksityiskohtaisia tietoja sen tyypistä, materiaalista, kunnosta ja muista olennaisista ominaisuuksista. Käytä suomen kieltä vastauksessasi.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analysoi tämä huonekalukuva ja anna yksityiskohtaisia tietoja:",
            },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });

    return imageAnalysisResult.text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Virhe kuvan analysoinnissa: ${error.message}`);
    } else {
      throw new Error("Tuntematon virhe kuvan analysoinnissa");
    }
  }
}
