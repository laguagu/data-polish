import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductStore } from "@/lib/store/productStore";
import { TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

type FlexibleProduct = Record<string, unknown>;
type ChartDataItem = { name: string; value: number };

const ProductChart = () => {
  const { products } = useProductStore() as { products: FlexibleProduct[] };
  // const products = mockProducts;
  const [selectedField, setSelectedField] = useState<string>("");

  const fields = useMemo(() => {
    if (products.length === 0) return [];
    const firstProduct = products[0];
    return Object.keys(firstProduct).filter(
      (key) =>
        typeof firstProduct[key] === "string" ||
        typeof firstProduct[key] === "number",
    );
  }, [products]);

  const chartData = useMemo((): ChartDataItem[] => {
    if (!selectedField) return [];

    const data: Record<string, number> = {};
    let total = 0;

    products.forEach((product) => {
      const value = product[selectedField];
      if (
        value != null &&
        (typeof value === "string" || typeof value === "number")
      ) {
        const key = String(value);
        data[key] = (data[key] || 0) + 1;
        total++;
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({
        name,
        value,
        percentage: `${((value / total) * 100).toFixed(1)}%`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Näytetään vain top 10 tulosta
  }, [products, selectedField]);

  // Set initial selected field
  useEffect(() => {
    if (fields.length > 0 && !selectedField) {
      setSelectedField(fields[0]);
    }
  }, [fields, selectedField]);

  const chartConfig: ChartConfig = {
    value: {
      label: selectedField,
      color: "hsl(var(--primary))",
    },
  };

  if (products.length === 0) {
    return null; // or return a "No data available" message
  }

  // Funktio pitkien nimien lyhentämiseen
  const shortenName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + "...";
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Tuotejakauma</CardTitle>
        <CardDescription>Top 10 {selectedField} luokasta</CardDescription>
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {fields.map((field) => (
              <SelectItem key={field} value={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-4">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 48, top: 20, bottom: 20 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={(props) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fill="#666"
                    fontSize={14}
                  >
                    {shortenName(payload.value, 15)}
                  </text>
                );
              }}
            />
            <XAxis type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[0, 4, 4, 0]}
            >
              <LabelList
                dataKey="percentage"
                position="insideLeft"
                offset={10}
                className="fill-[--color-label]"
                fontSize={14}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={10}
                className="fill-foreground"
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Näytetään top 10 {selectedField} jakautumista
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Perustuu nykyisiin tuotetietoihin
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductChart;
