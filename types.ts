
export interface PublicProject {
  name: string;
  link: string; // The full public share URL
  token: string; // Extracted from link
}

export interface Technician {
  id: string;
  name: string; // Full name (e.g. Max Mustermann)
  code: string; // Short code (e.g. MM)
  password?: string; // Login Password
  role: 'admin' | 'user'; // Rights management
}

export interface AppConfig {
  technicians: Technician[];
  projects: PublicProject[];
}

export interface MaterialItem {
  name: string;
  amount: string;
}

export interface DiaryEntry {
  date: string;
  location: string; // Adresse der Baustelle
  weather: string;
  activityType: 'Tiefbau' | 'Einblasen' | 'Spleißen' | 'Hausanschluss' | 'Sonstiges';
  description: string; // Was wurde erledigt
  missingWork: string; // Was fehlt noch
  materials: MaterialItem[]; // Materialliste
  technician: string; // Full name
  images: File[];
}

export interface FormStatus {
  step: 'login' | 'form' | 'uploading' | 'success';
  message?: string;
}

export enum WeatherCondition {
  SUNNY = "Sonnig",
  CLOUDY = "Bewölkt",
  RAINY = "Regnerisch",
  SNOWY = "Schnee",
  WINDY = "Windig"
}
