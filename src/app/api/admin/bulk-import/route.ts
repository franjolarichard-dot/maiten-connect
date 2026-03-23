import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin (Singleton)
if (!admin.apps.length) {
  try {
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!envVar) {
      console.error("FIREBASE_SERVICE_ACCOUNT no encontrada en process.env");
    } else {
      const serviceAccount = JSON.parse(envVar);
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin inicializado correctamente");
      } else {
        console.error("El JSON de FIREBASE_SERVICE_ACCOUNT no tiene project_id");
      }
    }
  } catch (error) {
    console.error("Error al inicializar Firebase Admin:", error);
  }
}

export async function POST(request: Request) {
  try {
    // Verificar si Admin SDK está listo
    if (!admin.apps.length) {
      let debugMsg = "Firebase Admin no configurado.";
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) debugMsg += " La variable de entorno está VACÍA.";
      else debugMsg += " El JSON parece ser inválido o incompleto.";

      return NextResponse.json(
        { error: debugMsg },
        { status: 500 }
      );
    }

    const { providers } = await request.json();

    if (!Array.isArray(providers)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[],
    };

    const auth = admin.auth();
    const db = admin.firestore();

    for (const p of providers) {
      try {
        const { nombre, email, telefono, servicios, ciudad } = p;
        const tempPassword = "Maiten2025!"; // Clave provisoria

        // 1. Crear usuario en Auth (o recuperar si ya existe)
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(email);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email,
              password: tempPassword,
              displayName: nombre,
            });
          } else {
            throw e;
          }
        }

        // 2. Crear/Actualizar perfil en Firestore (Colección providers)
        const servicesArray = typeof servicios === 'string' 
          ? servicios.split(',').map(s => s.trim().toLowerCase()) 
          : servicios;

        const providerData = {
          uid: userRecord.uid,
          displayName: nombre,
          email: email,
          phone: telefono || "",
          role: "PROVIDER",
          servicesOffered: servicesArray,
          location: { lat: -32.650, lng: -71.433, address: "Centro", city: ciudad || "Maitencillo" },
          activeRadiusKm: 30,
          rating: 5.0,
          reviewCount: 0,
          isAvailable: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('providers').doc(userRecord.uid).set(providerData, { merge: true });
        
        results.success++;
      } catch (err: any) {
        results.errors.push(`${p.email}: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error en bulk-import:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
