export type UserRole = 'CLIENT' | 'PROVIDER';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
}

export interface ProviderProfile extends UserProfile {
  servicesOffered: string[]; // e.g., 'gasfiter', 'electricista', 'jardinero'
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string; // Maitencillo, Zapallar, Cachagua, Papudo
  };
  activeRadiusKm: number; // Default 30km
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELED';

export interface ServiceRequest {
  id?: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  providerId: string;
  providerName?: string;
  providerPhone?: string;
  serviceCategory: string; // Interpreted by IA
  description: string; // The natural language prompt from the user
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedPrice?: number;
  estimatedTime?: string;
}

export interface Review {
  id?: string;
  requestId: string;
  clientId: string;
  providerId: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: Date;
}
