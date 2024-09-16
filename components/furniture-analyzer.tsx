"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

interface FormInputs {
  image: FileList;
  brand: string;
  model: string;
  type: string;
  material: string;
}

export default function FurnitureAnalysisForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormInputs>();
  const [result, setResult] = useState<string>("");
  const [bestMatchImageUrl, setBestMatchImageUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const watchImage = watch("image");

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setResult("");
    setBestMatchImageUrl("");
    setError(null);

    const formData = new FormData();
    formData.append("image", data.image[0]);
    formData.append(
      "furniture_details",
      JSON.stringify({
        brand: data.brand,
        model: data.model,
        type: data.type,
        material: data.material,
      }),
    );

    try {
      const response = await fetch("/api/visio", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || `HTTP error! status: ${response.status}`,
        );
      }

      setResult(responseData.finalAnalysis);
      setBestMatchImageUrl(responseData.bestMatchImageUrl);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during analysis",
      );
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, lineIndex) => {
      const boldParts = line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={`bold-${lineIndex}-${partIndex}`}
              className="font-semibold"
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.startsWith("## ")) {
        return (
          <h2 key={`h2-${lineIndex}`} className="text-2xl font-bold mt-6 mb-4">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        return (
          <h3 key={`h3-${lineIndex}`} className="text-xl font-bold mt-4 mb-3">
            {line.slice(4)}
          </h3>
        );
      }

      const listMatch = line.match(/^(\d+)\.\s(.+)/);
      if (listMatch) {
        const [, number, text] = listMatch;
        return (
          <div
            key={`list-item-${lineIndex}`}
            className="flex items-start mb-2 ml-4"
          >
            <span className="mr-2 font-bold">{number}.</span>
            <span>{formatMessage(text)}</span>
          </div>
        );
      } else if (line.trim().startsWith("•")) {
        const listItemText = line.trim().substring(1).trim();
        return (
          <div
            key={`bullet-item-${lineIndex}`}
            className="ml-8 flex items-start mb-2"
          >
            <span className="mr-2">•</span>
            <span>{formatMessage(listItemText)}</span>
          </div>
        );
      } else {
        return (
          <p key={`line-${lineIndex}`} className="mb-2 ml-4">
            {boldParts}
          </p>
        );
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Furniture Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Upload Image
              </Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (MAX. 800x400px)
                    </p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    {...register("image", { required: "Image is required" })}
                  />
                </label>
              </div>
              {watchImage && watchImage.length > 0 && (
                <p className="text-sm text-green-600">
                  File selected: {watchImage[0].name}
                </p>
              )}
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">
                  Brand
                </Label>
                <Input
                  id="brand"
                  type="text"
                  placeholder="Enter brand"
                  {...register("brand", { required: "Brand is required" })}
                />
                {errors.brand && (
                  <p className="text-sm text-red-500">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium">
                  Model
                </Label>
                <Input
                  id="model"
                  type="text"
                  placeholder="Enter model"
                  {...register("model", { required: "Model is required" })}
                />
                {errors.model && (
                  <p className="text-sm text-red-500">{errors.model.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type
                </Label>
                <Input
                  id="type"
                  type="text"
                  placeholder="Enter type"
                  {...register("type", { required: "Type is required" })}
                />
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="material" className="text-sm font-medium">
                  Material
                </Label>
                <Input
                  id="material"
                  type="text"
                  placeholder="Enter material"
                  {...register("material", {
                    required: "Material is required",
                  })}
                />
                {errors.material && (
                  <p className="text-sm text-red-500">
                    {errors.material.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Furniture"
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <h2 className="text-xl font-bold mb-2">Error:</h2>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Analysis Result:</h2>
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                {formatMessage(result)}
              </div>
            </div>
          )}

          {bestMatchImageUrl && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Best Match from Database 🧐
              </h2>
              <div className="relative w-full h-64">
                <Image
                  src={bestMatchImageUrl}
                  alt="Best match"
                  fill
                  objectFit="contain"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
