export enum CatStatus {
  HEALTHY = '健康',
  SICK = '生病',
  INJURED = '受伤',
  ADOPTED = '已领养',
  MISSING = '失踪',
  UNKNOWN = '未知'
}

export enum Gender {
  MALE = '公',
  FEMALE = '母',
  UNKNOWN = '未知'
}

export interface CatProfile {
  id: string;
  name: string;
  location: string; // e.g., "Library Steps", "Dorm 3"
  breed: string;
  color: string;
  estimatedAge: string;
  gender: Gender;
  status: CatStatus;
  features: string; // Distinctive markings
  imageUrl: string;
  lastSeen: number; // Timestamp
  notes: string;
}

// For the Gemini API response
export interface CatAnalysisResult {
  breed: string;
  color: string;
  estimatedAge: string;
  features: string;
  possibleNameSuggestions: string[];
  visualHealthAssessment: string;
}
