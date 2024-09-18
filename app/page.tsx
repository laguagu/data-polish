"use client";

import { HeaderTexts } from "@/components/kiertonet/3d/header-texts";
import ProductChart from "@/components/kiertonet/chart/product-chart";
import { DownloadButton } from "@/components/kiertonet/download-button";
import { ProductTable } from "@/components/kiertonet/product-table";
import { ProductUploader } from "@/components/kiertonet/product-upoloader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProductStore } from "@/lib/store/productStore";
import { Download, FileSpreadsheet, RefreshCw, Zap } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [showPreview, setShowPreview] = useState(false);
  const { setProducts, products } = useProductStore((state) => ({
    setProducts: state.setProducts,
    products: state.products,
  }));

  const handleAnalysisComplete = () => {
    setShowPreview(true);
  };

  const handleStartOver = () => {
    setShowPreview(false);
    setProducts([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-4 mb-8">
          <HeaderTexts text="DataPolish" />
        </header>

        <Card className="border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* <ProductChart /> */}
            {!showPreview ? (
              <ProductUploader
                handleAnalysisComplete={handleAnalysisComplete}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Käsitelty Data</h2>
                  <Button onClick={handleStartOver} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aloita alusta
                  </Button>
                </div>
                <ProductTable />
                <DownloadButton />
                {/* <ProductChartDialog /> */}
                <ProductChart />
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm hover:bg-gray-800 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 text-blue-400 mb-4">
                <FileSpreadsheet className="h-8 w-8" />
                <h3 className="text-xl font-semibold">Lataa</h3>
              </div>
              <p className="text-gray-300">
                Lataa saumattomasti CSV- tai Excel-tiedostot, jotka sisältävät
                tuotetiedot tekoälypohjaista parannusta varten.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm hover:bg-gray-800 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 text-green-400 mb-4">
                <Zap className="h-8 w-8" />
                <h3 className="text-xl font-semibold">Paranna</h3>
              </div>
              <p className="text-gray-300">
                Kehittyneet tekoälyalgoritmimme parantavat ja rikastavat
                tuotetietojasi automaattisesti parhaiden tulosten
                saavuttamiseksi.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm hover:bg-gray-800 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 text-purple-400 mb-4">
                <Download className="h-8 w-8" />
                <h3 className="text-xl font-semibold">Lataa</h3>
              </div>
              <p className="text-gray-300">
                Lataa parannettu data välittömästi, valmis saumattomaan
                integrointiin tuoteluetteloihisi.
              </p>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-gray-400 mt-12">
          <p>&copy; 2024 DataPolish</p>
        </footer>
      </div>
    </div>
  );
}
