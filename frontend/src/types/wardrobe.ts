import { z } from 'zod';
import {
  ClothingItemSchema,
  OutfitSchema,
  OutfitGeneratedOutfitSchema,
  UserProfileSchema,
  OpenAIClothingAnalysisSchema,
  validateClothingItem,
  validateClothingItems,
  validateUserProfile
} from '@shared/types/wardrobe';
import type {
  ClothingItem,
  Outfit,
  OutfitGeneratedOutfit,
  UserProfile,
  Color,
  OpenAIClothingAnalysis,
  Metadata,
  ColorAnalysis
} from '@shared/types/wardrobe';
import { ApiResponse } from './api';
import { ClothingTypeEnum } from '@shared/types';

// Define ClothingType locally
export type ClothingType = z.infer<typeof ClothingTypeEnum>;

// Re-export everything from shared types
export * from '@shared/types';

// Re-export validation functions
export { validateClothingItem, validateClothingItems, validateUserProfile };

// Re-export types
export type {
  ClothingItem,
  Outfit,
  OutfitGeneratedOutfit,
  UserProfile,
  Color,
  OpenAIClothingAnalysis,
  Metadata,
  ColorAnalysis
};

// Additional types for the frontend
export type ProcessImagesResult = {
  success: boolean;
  data?: {
    newItems: ClothingItem[];
    totalProcessed: number;
    successfulUploads: number;
  };
  error?: string;
};

export type ProcessImagesResponse = ApiResponse<{
  newItems: ClothingItem[];
  totalProcessed: number;
  successfulUploads: number;
}>;

export type WardrobeItemResponse = ApiResponse<ClothingItem>;
export type WardrobeItemsResponse = ApiResponse<ClothingItem[]>;
export type ImageAnalysisResult = OpenAIClothingAnalysis;
export type ImageAnalysisResponse = ApiResponse<ImageAnalysisResult>;
export type SuccessResponse<T> = {
  success: true;
  data: T;
};
export type ErrorResponse = {
  success: false;
  error: string;
  data: null;
};

// Helper functions
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is SuccessResponse<T> => {
  return response.success === true;
};

export const isErrorResponse = <T>(response: ApiResponse<T>): response is ErrorResponse => {
  return response.success === false;
};

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export type TemperatureRange = 'very_cold' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot' | 'very_hot';
export type Material = 'cotton' | 'wool' | 'silk' | 'linen' | 'denim' | 'leather' | 'synthetic' | 'knit' | 'fleece' | 'other';
export type BodyType = 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted_triangle';
export type SkinTone = 'warm' | 'cool' | 'neutral';

export interface TemperatureCompatibility {
  minTemp: number;
  maxTemp: number;
  recommendedLayers: string[];
  materialPreferences: Material[];
}

export interface MaterialCompatibility {
  compatibleMaterials: Material[];
  weatherAppropriate: Record<string, Material[]>;
}

export interface BodyTypeCompatibility {
  recommendedFits: Record<BodyType, string[]>;
  styleRecommendations: Record<BodyType, string[]>;
}

export interface SkinToneCompatibility {
  compatibleColors: Record<SkinTone, string[]>;
  recommendedPalettes: Record<SkinTone, string[]>;
}

export interface OutfitScoring {
  versatility: number;
  seasonality: number;
  formality: number;
  trendiness: number;
  quality: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  type: ClothingType;
  color: string;
  season: Season[];
  style: string[];
  tags?: string[];
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  favorite?: boolean; // Added to match backend implementation
  wearCount?: number; // Wear count tracking
  lastWorn?: number | null; // Last worn timestamp
  occasion?: string[]; // Occasion tags
  metadata?: {
    brand?: string;
    material?: string;
    pattern?: string;
    fit?: string;
    colorAnalysis?: {
      dominant?: string[];
      matching?: string[];
    };
    temperatureCompatibility?: TemperatureCompatibility;
    materialCompatibility?: MaterialCompatibility;
    bodyTypeCompatibility?: BodyTypeCompatibility;
    skinToneCompatibility?: SkinToneCompatibility;
    outfitScoring?: OutfitScoring;
  };
} 