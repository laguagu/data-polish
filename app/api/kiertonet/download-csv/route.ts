// api/download-csv/route.ts
import { stringify } from "csv-stringify/sync";
import iconv from "iconv-lite";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { products } = await req.json();

    const searchParams = req.nextUrl.searchParams;
    const fields = searchParams.get("fields")?.split(",");
    const format = searchParams.get("format") as string;

    const data = products.map((product: any) => {
      if (!fields || fields.length === 0) {
        return product;
      }
      const filteredProduct: any = {};
      fields.forEach((field: string) => {
        filteredProduct[field] = product[field];
      });
      return filteredProduct;
    });

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=processed_products.xlsx",
        },
      });
    } else {
      const csvData = stringify(data, {
        header: true,
        delimiter: ";",
      });

      // Convert the CSV string to a Buffer with UTF-8 encoding
      const csvBuffer = Buffer.from(csvData, "utf8");

      // Convert the UTF-8 Buffer to ISO-8859-1 (Latin-1) encoding
      const latin1Buffer = iconv.encode(
        csvBuffer.toString("utf8"),
        "ISO-8859-1",
      );

      return new NextResponse(latin1Buffer, {
        headers: {
          "Content-Type": "text/csv; charset=ISO-8859-1",
          "Content-Disposition": "attachment; filename=processed_products.csv",
        },
      });
    }
  } catch (error) {
    console.error("Error generating file:", error);
    return NextResponse.json(
      { error: "Error generating file" },
      { status: 500 },
    );
  }
}
