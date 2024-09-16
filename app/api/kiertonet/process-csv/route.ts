import { mockProducts } from "@/data/kiertonet-mock-data";
import { refactorProduct } from "@/lib/kiertonet/ai/generateObject";
import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";

export const dynamic = "force-dynamic";

const useMockData = false; // Aseta tämä true:ksi käyttääksesi mock-dataa

export async function POST(req: NextRequest) {
  const signal = req.signal; // Käytä tätä signaalia, jos haluat keskeyttää pyynnön
  if (useMockData) {
    const processedProducts = mockProducts.flatMap((product, productIndex) =>
      Array(10)
        .fill(null)
        .map((_, copyIndex) => ({
          ...product,
          id: `${productIndex * 10 + copyIndex}-${product.title || "untitled"}`,
          title: `${product.title} (Kopio ${copyIndex + 1})`,
          price: product.price + copyIndex,
          postalCode: String(Number(product.postalCode) + copyIndex),
        })),
    );
    const stream = new ReadableStream({
      async start(controller) {
        const totalProducts = processedProducts.length;
        for (let i = 0; i < totalProducts; i++) {
          if (signal?.aborted) {
            controller.close();
            return;
          }
          const progress = Math.round(((i + 1) / totalProducts) * 100);
          controller.enqueue(
            `data: ${JSON.stringify({ progress, product: processedProducts[i] })}\n\n`,
          );
          // Simuloidaan viivettä mock-datan lähetyksessä
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const isDynamic = formData.get("isDynamic") === "true";

  let dynamicSchema: z.ZodSchema | null = null;

  if (isDynamic) {
    const columnsJson = formData.get("columns") as string;
    const columns = JSON.parse(columnsJson);

    // Luo dynaaminen skeema
    const generateDynamicSchema = () => {
      const schemaObject: { [key: string]: z.ZodTypeAny } = {};
      columns.forEach((column: { name: string; type: string }) => {
        switch (column.type) {
          case "string":
            schemaObject[column.name] = z.string().nullable();
            break;
          case "number":
            schemaObject[column.name] = z.number().nullable();
            break;
          case "boolean":
            schemaObject[column.name] = z.boolean().nullable();
            break;
          default:
            schemaObject[column.name] = z.string().nullable();
        }
      });
      return z.object(schemaObject);
    };

    dynamicSchema = generateDynamicSchema();
    console.log("Columns:", columns);
    console.log("Dynamic Schema:", dynamicSchema);
    console.log("Dynamic Schema Shape:", dynamicSchema._def);
  }

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const decodeSting = iconv.decode(Buffer.from(fileBuffer), "ISO-8859-1");
  let records: any[];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (file.name.endsWith(".csv")) {
          records = parse(decodeSting, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ";",
            quote: '"',
            ltrim: true,
            rtrim: true,
            relax_column_count: true,
            relax_quotes: true,
            encoding: "utf-8",
            from_line: 2,
          });
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          const workbook = XLSX.read(fileBuffer, { codepage: 65001 });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          records = XLSX.utils.sheet_to_json(worksheet);
        } else {
          throw new Error("Unsupported file format");
        }

        const filteredRecords = records.filter((record) =>
          Object.values(record).some((value) => value !== ""),
        );

        const totalRecords = filteredRecords.length;

        for (let i = 0; i < filteredRecords.length; i++) {
          if (signal?.aborted) {
            controller.close();
            return;
          }

          const record = filteredRecords[i];
          const cleanedRecord = Object.fromEntries(
            Object.entries(record).map(([key, value]) => [
              key.trim(),
              typeof value === "string" ? value.trim() : value,
            ]),
          );

          try {
            let refactoredProduct;
            if (isDynamic && dynamicSchema) {
              refactoredProduct = await refactorProduct(
                cleanedRecord,
                dynamicSchema,
              );
            } else {
              refactoredProduct = await refactorProduct(cleanedRecord);
            }
            const progress = Math.round(((i + 1) / totalRecords) * 100);

            const productToSend = {
              ...refactoredProduct,
              id: `${i}-${refactoredProduct.title || "untitled"}`,
            };

            controller.enqueue(
              `data: ${JSON.stringify({ progress, product: productToSend })}\n\n`,
            );
          } catch (error) {
            console.error(`Error processing product ${i}:`, error);
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
