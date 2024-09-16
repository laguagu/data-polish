"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { refactoredProductSchema } from "@/lib/kiertonet/schemas";
import { useProductStore } from "@/lib/store/productStore";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

export function DownloadButton() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const products = useProductStore((state) => state.products);
  const columns = useProductStore((state) => state.columns);
  const isDynamic = useProductStore((state) => state.isDynamic);

  // Määritellään allFields dynaamisesti
  const allFields = isDynamic
    ? columns.map((col) => col.name)
    : Object.keys(refactoredProductSchema.shape);

  const handleFieldChange = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    const fields =
      isCustomFieldsOpen && selectedFields.length > 0
        ? selectedFields
        : allFields;
    try {
      const response = await fetch(
        `/api/kiertonet/download-csv?format=${format}&fields=${fields.join(",")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ products }),
        },
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `processed_products.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()}-tiedosto ladattu onnistuneesti.`, {
        icon: "✅",
      });
    } catch (error) {
      console.error(`Error downloading ${format.toUpperCase()}:`, error);
      toast.error(
        `${format.toUpperCase()}-tiedoston lataaminen epäonnistui. Yritä uudelleen.`,
        {
          icon: "❌",
        },
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Collapsible
        open={isCustomFieldsOpen}
        onOpenChange={setIsCustomFieldsOpen}
      >
        <CollapsibleTrigger asChild>
          <Button variant="outline">
            {isCustomFieldsOpen
              ? "Piilota kenttävalinta"
              : "Valitse ladattavat kentät"}
          </Button>
        </CollapsibleTrigger>
        <AnimatePresence>
          {isCustomFieldsOpen && (
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {allFields.map((field) => (
                    <div key={field} className="flex items-center">
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldChange(field)}
                      />
                      <label htmlFor={field} className="ml-2 text-sm">
                        {field}
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
      <div className="mt-4 space-x-2">
        <Button onClick={() => handleDownload("csv")}>Lataa CSV</Button>
        <Button onClick={() => handleDownload("xlsx")}>Lataa Excel</Button>
      </div>
    </motion.div>
  );
}
