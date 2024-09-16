"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/lib/kiertonet/schemas";
import { useProductStore } from "@/lib/store/productStore";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const columnHelper = createColumnHelper<Product>();

export function ProductTable() {
  const {
    products,
    setProducts,
    isDynamic,
    columns: dynamicColumns,
  } = useProductStore((state) => ({
    products: state.products,
    setProducts: state.setProducts,
    isDynamic: state.isDynamic,
    columns: state.columns,
  }));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Product, any>[]>(() => {
    if (isDynamic) {
      // Dynaamiset sarakkeet
      return [
        ...dynamicColumns.map((col) => {
          return columnHelper.accessor(
            (row) => row[col.name as keyof Product],
            {
              id: col.name,
              header: col.name,
              cell: (info) => info.getValue(),
            },
          );
        }),
        columnHelper.display({
          id: "actions",
          cell: (props) => (
            <Button onClick={() => handleEdit(props.row.original)}>
              Muokkaa
            </Button>
          ),
        }),
      ];
    }

    return [
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Otsikko
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("category", {
        header: "Kategoria",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("material", {
        header: "Materiaali",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("condition", {
        header: "Kunto",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("price", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Hinta
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("images", {
        header: "Kuvat",
        cell: (info) => {
          const images = info.getValue() as string;
          const imageCount = images ? images.split(",").length : 0;
          return `${imageCount} kuvaa`;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) => (
          <Button onClick={() => handleEdit(props.row.original)}>
            Muokkaa
          </Button>
        ),
      }),
    ];
  }, [isDynamic, dynamicColumns]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "auto", // Tämä asetus hakee kaikista sarakkeista
    pageCount: Math.ceil(products.length / pagination.pageSize),
  });

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingProduct) {
      try {
        const updatedProducts = products.map((p) =>
          p.id === editingProduct.id ? editingProduct : p,
        );

        setProducts(updatedProducts);
        setEditingProduct(null);
        setIsDialogOpen(false);
        toast.success("Tuote päivitetty onnistuneesti.", {
          icon: "✅",
        });
      } catch (error) {
        console.error("Error saving product:", error);
        toast.error("Tuotteen tallentaminen epäonnistui. Yritä uudelleen.", {
          icon: "❌",
        });
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [field]: value });
    }
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category || "Ei kategoriaa")),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Hae tuotteita..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rivejä per sivu" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} riviä
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              table
                .getColumn("category")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Valitse kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kaikki kategoriat</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Ei tuloksia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} tuotetta yhteensä
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Sivu {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ensimmäinen sivu</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Edellinen sivu</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Seuraava sivu</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Viimeinen sivu</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Muokkaa tuotetta</DialogTitle>
            <DialogDescription>
              Muokkaa tuotteen tietoja alla olevissa kentissä.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6">
            {editingProduct &&
              Object.entries(editingProduct).map(([key, value]) => {
                // Voit halutessasi suodattaa pois tietyt kentät, kuten 'id'
                if (key === "id") return null;

                return (
                  <div
                    key={key}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    <label
                      htmlFor={key}
                      className="text-right text-sm font-medium"
                    >
                      {key}
                    </label>
                    {typeof value === "string" && value.length > 100 ? (
                      <Textarea
                        id={key}
                        value={value as string}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="col-span-3"
                      />
                    ) : (
                      <Input
                        id={key}
                        value={value as string}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="col-span-3"
                      />
                    )}
                  </div>
                );
              })}
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Tallenna muutokset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
