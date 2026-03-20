import { doc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';
import { db } from './firebase';
import { Review } from './types';

export const submitReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
  // 1. Guardar la reseña
  const reviewData: Omit<Review, 'id'> = {
    ...review,
    createdAt: new Date(),
  };
  await addDoc(collection(db, 'reviews'), reviewData);

  // 2. Actualizar el promedio del proveedor
  const provRef = doc(db, 'providers', review.providerId);
  await updateDoc(provRef, {
    rating: increment(review.rating), // Acumula puntaje total
    reviewCount: increment(1),
  });

  // 3. Marcar la solicitud como COMPLETED
  const reqRef = doc(db, 'requests', review.requestId);
  await updateDoc(reqRef, {
    status: 'COMPLETED',
    updatedAt: new Date(),
  });
};
