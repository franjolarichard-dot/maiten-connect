import { collection, doc, setDoc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, ProviderProfile, ServiceRequest, RequestStatus } from './types';

export const createUserProfile = async (uid: string, profile: Omit<UserProfile, 'uid'>) => {
  await setDoc(doc(db, 'users', uid), { uid, ...profile });
};

export const createProviderProfile = async (uid: string, profile: Omit<ProviderProfile, 'uid'>) => {
  await setDoc(doc(db, 'providers', uid), { uid, ...profile });
};

export const createServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const reqData: ServiceRequest = {
    ...request,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const docRef = await addDoc(collection(db, 'requests'), reqData);
  return docRef.id;
};

// Hybrid tracking logic: Provider accepts the job and records the data
export const acceptServiceRequest = async (
  requestId: string, 
  providerId: string, 
  providerName: string,
  providerPhone: string,
  estimatedTime: string, 
  estimatedPrice?: number
) => {
  const reqRef = doc(db, 'requests', requestId);
  const updateData: any = {
    status: 'ACCEPTED',
    providerId: providerId,
    providerName: providerName,
    providerPhone: providerPhone,
    estimatedTime,
    updatedAt: new Date()
  };
  
  if (estimatedPrice !== undefined) {
    updateData.estimatedPrice = estimatedPrice;
  }

  await updateDoc(reqRef, updateData);
  // After this resolves, the platform guarantees a registered "MATCH" 
  // and the UI can reveal the "Coordinar por WhatsApp" floating button.
};

export const updateProviderProfile = async (uid: string, profile: Partial<ProviderProfile>) => {
  const providerRef = doc(db, 'providers', uid);
  await updateDoc(providerRef, { ...profile });
};
