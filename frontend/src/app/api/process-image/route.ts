import { NextResponse } from 'next/server';
import { processAndAddImages } from '@/lib/firebase/wardrobeService';
import { uploadImage } from '@/lib/firebase/storageService';
import { analyzeClothingImage } from '@/lib/services/clothingImageAnalysis';
import { convertOpenAIAnalysisToClothingItem } from '@/lib/utils/validation';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set');
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Get the current user's ID token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No user ID provided' },
        { status: 400 }
      );
    }

    // Verify that the token's user ID matches the provided user ID
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User ID mismatch' },
        { status: 401 }
      );
    }

    // Generate a temporary ID for the embedding request
    const tempId = uuidv4();

    try {
      // 1. Upload image to Firebase Storage
      const uploadedImage = await uploadImage(file, userId);
      console.log('Image uploaded:', uploadedImage);

      // 2. Generate OpenAI analysis
      const analysisResponse = await analyzeClothingImage(uploadedImage.url);
      console.log('Analysis response:', analysisResponse);

      if (!analysisResponse || 'error' in analysisResponse) {
        throw new Error('Failed to analyze image');
      }

      // 3. Create clothing item from analysis
      const item = convertOpenAIAnalysisToClothingItem(
        analysisResponse,
        userId,
        uploadedImage.url
      );

      // 4. Generate CLIP embedding
      const formData = new FormData();
      formData.append('image', file);
      formData.append('item_id', tempId);

      const embeddingResponse = await fetch('/api/embed', {
        method: 'POST',
        body: formData,
      });

      let embedding: number[] | undefined;
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        embedding = embeddingData.embedding;
      }

      // 5. Create final item with embedding
      const finalItem = {
        ...item,
        embedding,
        backgroundRemoved: true, // For testing, assume background is removed
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          ...item.metadata,
          basicMetadata: {
            ...item.metadata?.basicMetadata,
            gps: item.metadata?.basicMetadata?.gps ? 
              (typeof item.metadata.basicMetadata.gps === 'string' ? 
                item.metadata.basicMetadata.gps : 
                JSON.stringify(item.metadata.basicMetadata.gps)) : 
              null
          }
        }
      };

      // 6. Save to Firestore
      const docRef = doc(collection(db, 'wardrobe'));
      await setDoc(docRef, {
        ...finalItem,
        id: docRef.id,
        userId: userId
      });

      // 7. Return the processed item with all metadata
      return NextResponse.json({
        success: true,
        data: {
          ...finalItem,
          id: docRef.id,
          userId: userId
        }
      });

    } catch (error) {
      console.error('Error processing image:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to process image'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
} 