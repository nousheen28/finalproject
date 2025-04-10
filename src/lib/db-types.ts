export type Schema = {
  users: {
    id?: number;
    name: string;
    email: string;
    accessibilityPreferences?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  places: {
    id?: number;
    osmId?: string | null;
    name: string;
    address?: string | null;
    latitude: number;
    longitude: number;
    placeType: string;
    accessibilityFeatures?: string | null;
    photos?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  savedPlaces: {
    id?: number;
    userId: number;
    placeId: number;
    createdAt?: string;
  };
  accessibilityReports: {
    id?: number;
    placeId: number;
    userId: number;
    reportType: string;
    description?: string | null;
    status?: string;
    createdAt?: string;
  };
  emergencyContacts: {
    id?: number;
    userId: number;
    name: string;
    phone: string;
    relationship?: string | null;
    createdAt?: string;
  };
  routes: {
    id?: number;
    userId: number;
    startPointLat: number;
    startPointLng: number;
    endPointLat: number;
    endPointLng: number;
    waypoints?: string | null;
    accessibilityConsiderations?: string | null;
    distance?: number | null;
    duration?: number | null;
    createdAt?: string;
  };
};