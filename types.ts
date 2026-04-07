
export interface PublicProject {
  name: string;
  link: string; // The full public share URL
  token: string; // Extracted from link
  nextcloudPath?: string; // Specific folder in Nextcloud for this project
}

export interface Technician {
  id: string;
  name: string; // Full name (e.g. Max Mustermann)
  code: string; // Short code (e.g. MM)
  password?: string; // Login Password
  role: 'admin' | 'user'; // Rights management
  nextcloudUser?: string; // Nextcloud Username
  nextcloudPass?: string; // Nextcloud App Password
}

export interface AppConfig {
  technicians: Technician[];
  projects: PublicProject[];
  logo?: string; // Base64 encoded custom logo
  nextcloudUrl?: string; // Base URL of the Nextcloud instance
  manualWebdavUrl?: string; // Manual override for WebDAV URL
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
  technicianUid?: string; // Firebase UID
  images: File[];
}

export interface FormStatus {
  step: 'login' | 'form' | 'uploading' | 'success' | 'error';
  message?: string;
  error?: string;
  details?: any;
}

export enum WeatherCondition {
  SUNNY = "Sonnig",
  CLOUDY = "Bewölkt",
  RAINY = "Regnerisch",
  SNOWY = "Schnee",
  WINDY = "Windig"
}
