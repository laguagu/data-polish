"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/lib/kiertonet/schemas";
import { useProductStore } from "@/lib/store/productStore";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import SubmitButton from "../submit-button";
import { FileTarget } from "./file-target";
type props = {
  handleAnalysisComplete: () => void;
};

const warningToast = (title: string, message: string) => {
  toast(
    (t) => (
      <div className="flex flex-col">
        <div className="font-bold text-amber-600">{title}</div>
        <div className="mt-1">{message}</div>
        <Button
          variant="outline"
          className="mt-3 self-end"
          onClick={() => toast.dismiss(t.id)}
        >
          Ymmärrän
        </Button>
      </div>
    ),
    { duration: Infinity },
  );
};

export function ProductUploader({ handleAnalysisComplete }: props) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [newColumn, setNewColumn] = useState({ name: "", type: "string" });
  const [activeTab, setActiveTab] = useState("current");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>(
    [],
  );
  const {
    setProducts,
    setColumns: setColumnsStore,
    setIsDynamic,
    isDynamic,
  } = useProductStore();

  useEffect(() => {
    setColumnsStore(columns);
  }, [columns, setColumnsStore]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsDynamic(value === "new");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [".csv", ".xlsx", ".xls"];
      const fileExtension =
        "." + selectedFile.name.split(".").pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        warningToast(
          "Virheellinen tiedostotyyppi",
          `Tiedostotyyppi ${fileExtension} ei ole sallittu. Sallitut tyypit ovat: ${allowedTypes.join(", ")}`,
        );
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      readFile(selectedFile);
    }
  };

  const handleFileDrop = useCallback((droppedFile: File) => {
    setFile(droppedFile);
    readFile(droppedFile);
  }, []);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setData(data);
      const initialColumns = Object.keys(data[0] || {}).map((key) => ({
        name: key,
        type: "string",
      }));
      setColumns(initialColumns);
    };
    reader.readAsBinaryString(file);
  };

  const addColumn = () => {
    if (newColumn.name && !columns.some((col) => col.name === newColumn.name)) {
      setColumns([...columns, newColumn]);
      setData(data.map((row) => ({ ...row, [newColumn.name]: "" })));
      setNewColumn({ name: "", type: "string" });
    }
  };

  const removeColumn = (columnToRemove: string) => {
    if (columns.length <= 1) {
      warningToast(
        "Viimeistä saraketta ei voi poistaa",
        "Muista, että et voi poistaa viimeistä saraketta.",
      );
      return;
    }

    const updatedColumns = columns.filter(
      (column) => column.name !== columnToRemove,
    );
    setColumns(updatedColumns);
    setData(
      data.map((row) => {
        const { [columnToRemove]: _, ...rest } = row;
        return rest;
      }),
    );

    if (updatedColumns.length === 1) {
      warningToast(
        "Vain yksi sarake jäljellä",
        "Tarvitset vähintään yhden sarakkeen tietojen tallentamiseen.",
      );
    }
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setProgress(0);
      toast("Tiedoston käsittely keskeytetty.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const controller = new AbortController();
    setAbortController(controller);

    startTransition(async () => {
      try {
        setProgress(0);
        setProducts([]);
        const formData = createFormData();
        const response = await fetchData(formData, controller.signal);
        const processedProducts = await processStreamResponse(
          response,
          controller.signal,
        );
        handleProcessingResult(processedProducts);
      } catch (error) {
        handleError(error);
      } finally {
        setAbortController(null);
        setProgress(0);
      }
    });
  };
  const createFormData = () => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("columns", JSON.stringify(columns));
    formData.append("isDynamic", isDynamic.toString());
    return formData;
  };

  const fetchData = async (formData: FormData, signal: AbortSignal) => {
    const response = await fetch("/api/kiertonet/process-csv", {
      method: "POST",
      body: formData,
      signal,
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return response;
  };

  const processStreamResponse = async (
    response: Response,
    signal: AbortSignal,
  ) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get reader from response");

    const decoder = new TextDecoder();
    let buffer = "";
    let processedProducts: Product[] = [];

    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            setProgress(data.progress);
            if (data.product) {
              processedProducts.push(data.product);
              console.log("processedProducts", processedProducts);

              setProducts(processedProducts);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Stream reading was aborted");
          break;
        }
        throw error;
      }
    }

    return processedProducts;
  };

  const handleProcessingResult = (processedProducts: Product[]) => {
    if (processedProducts.length === 0) {
      toast.error("Ei tuloksia. Tarkista tiedosto ja yritä uudelleen.");
    } else {
      toast.success(
        `Tiedosto käsitelty onnistuneesti. ${processedProducts.length} tuotetta ladattu`,
      );
      handleAnalysisComplete();
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("File processing was aborted");
      toast("Tiedoston käsittely keskeytetty.");
    } else {
      console.error("Error:", error);
      toast.error("Virhe tiedoston käsittelyssä. Yritä uudelleen");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addColumn();
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="flex justify-center">
        <TabsList className="">
          <TabsTrigger value="current">Vakiomalli</TabsTrigger>
          <TabsTrigger value="new">Mukautettu malli</TabsTrigger>
        </TabsList>
      </div>
      <div className="text-center mt-4 text-gray-600 leading-relaxed">
        Vakiomalli on valmiin tuotetietomallin mukaan luotu tiedosto.
        Mukautetulla mallilla voit määritellä sarakkeet itse.
      </div>
      <TabsContent value="current">
        <DndProvider backend={HTML5Backend}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FileTarget onDrop={handleFileDrop}>
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klikkaa ladataksesi</span>{" "}
                      tai raahaa ja pudota
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV, XLSX, tai XLS (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                  />
                </label>
              </FileTarget>
              {file && (
                <p className="text-sm text-gray-600 text-center">
                  Valittu tiedosto:{" "}
                  <span className="text-green-600">{file.name}</span>
                </p>
              )}
              <SubmitButton isPending={isPending} file={file} />
            </form>
            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm">{progress}% käsitelty</p>
                    <Button
                      onClick={handleAbort}
                      variant="destructive"
                      size="sm"
                    >
                      Peruuta
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DndProvider>
      </TabsContent>
      <TabsContent value="new">
        <DndProvider backend={HTML5Backend}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FileTarget onDrop={handleFileDrop}>
                <label
                  htmlFor="dropzone-file-new"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klikkaa ladataksesi</span>{" "}
                      tai raahaa ja pudota
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV, XLSX, tai XLS (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    id="dropzone-file-new"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                  />
                </label>
              </FileTarget>
              {file && (
                <p className="text-sm text-gray-600 text-center">
                  Valittu tiedosto:{" "}
                  <span className="text-green-600">{file.name}</span>
                </p>
              )}
              {data.length > 0 && (
                <>
                  <p className="text-gray-600">
                    Lisää tai poista tiedoston otsikkotekstejä, joiden
                    perusteella tekoäly luo sinulle uuden tiedoston
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Uuden sarakkeen nimi"
                      value={newColumn.name}
                      onKeyDown={handleKeyDown}
                      onChange={(e) =>
                        setNewColumn({ ...newColumn, name: e.target.value })
                      }
                      className="flex-grow"
                    />
                    <Select
                      value={newColumn.type}
                      onValueChange={(value) =>
                        setNewColumn({ ...newColumn, type: value })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Valitse tyyppi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Teksti</SelectItem>
                        <SelectItem value="number">Numero</SelectItem>
                        <SelectItem value="boolean">Totuusarvo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addColumn} type="button">
                      <Plus className="w-4 h-4 mr-2" />
                      Lisää sarake
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column) => (
                            <TableHead
                              key={column.name}
                              className="whitespace-nowrap px-4 py-2"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className="truncate max-w-[150px]"
                                  title={`${column.name} (${column.type})`}
                                >
                                  {column.name} ({column.type})
                                </span>
                                <Button
                                  type="button"
                                  onClick={() => removeColumn(column.name)}
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {columns.map((column) => (
                              <TableCell
                                key={column.name}
                                className="px-4 py-2 max-w-[200px] break-words"
                              >
                                <div className="whitespace-normal overflow-hidden">
                                  {row[column.name] || ""}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              <SubmitButton isPending={isPending} file={file} />
            </form>
            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm">{progress}% käsitelty</p>
                    <Button
                      onClick={handleAbort}
                      variant="destructive"
                      size="sm"
                    >
                      Peruuta
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DndProvider>
      </TabsContent>
    </Tabs>
  );
}
