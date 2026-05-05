export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Terras {
  _id: string;
  uuid: string;
  osmUri?: string;
  name: string;
  description?: string;
  address: string;
  url?: string;
  location: GeoPoint;
  intensity: number; // 0-100
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  latestSunData?: {
    rawCloudCover?: number;
    cloudFactor?: number;
    intensity?: number;
  };
 
}

export interface Restaurant {
  _id: string;
  uuid: string;
  osmUri?: string;
  name: string;
  address: string;
  cuisine: string;
  rating: number; // 0-5
  phone?: string;
  website?: string;
  openingHours?: string;
  takeaway?: boolean;
  location: GeoPoint;
  intensity: number; // 0-100
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  latestSunData?: {
    rawCloudCover?: number;
    cloudFactor?: number;
    intensity?: number;
  };
}

export interface Event {
  _id: string;
  uuid: string;
  eventUri?: string;
  title: string;
  address: string;
  date_start: string;
  date_end: string;
  description?: string;
  url?: string;
  intensity?: number;
  location: GeoPoint;
  locationRef?: string;
  locationType?: 'terras' | 'restaurant';
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;

  latestSunData?: {
    rawCloudCover?: number;
    cloudFactor?: number;
    intensity?: number;
  };
}

export interface GoldenHour {
  dawnStart: string;
  dawnEnd: string;
  duskStart: string;
  duskEnd: string;
}

export interface SunData {
  _id: string;
  locationRef: string;
  locationType: 'Terras' | 'Restaurant' | 'Event';
  dateTime: string;
  intensity: number; // 0-100
  azimuth: number;   // radians
  altitude: number;  // radians
  goldenHour: GoldenHour;
  createdAt: string;
  updatedAt: string;
  rawCloudCover?: number; 
  cloudFactor?: number;
}

export interface Weather {
  _id: string;
  timestamp: string;
  temperature: number;
  cloudCover: number;
  cloudFactor: number;
  uvIndex: number;
  windspeed: number;
  location: GeoPoint;
  createdAt: string;
  updatedAt: string;
}
