import { FurnitureMetadata } from "./schemas";

export type FurnitureDetailsForm = {
  name: string;
  description: string;
  price: number;
  dimensions: string;
  color: string;
  material: string;
  style: string;
  type: string;
  room: string;
  image: string;
};

export interface FurnitureDetails {
  //   id: string; // UUID
  type: string; // VARCHAR(255)
  brand?: string; // VARCHAR(255), optional
  material?: string; // VARCHAR(255), optional
  image_url?: string; // VARCHAR(255), optional
  vendor?: string; // VARCHAR(255), optional
  condition?: string; // VARCHAR(50), optional
  price?: number | null; // DECIMAL(10, 2)
  description?: string; // TEXT, optional
  created_at?: Date; // TIMESTAMP WITH TIME ZONE, optional
  updated_at?: Date; // TIMESTAMP WITH TIME ZONE, optional
  metadata?: FurnitureMetadata; // JSONB, optional
  embedding?: number[]; // vector(1536), optional
}
