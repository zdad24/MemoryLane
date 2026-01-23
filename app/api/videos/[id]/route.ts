/**
 * Video by ID API Route
 * GET /api/videos/:id - Get a single video
 * DELETE /api/videos/:id - Delete a video
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, storage, docToVideo } from '@/lib/services/firebase-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  console.log(`[Videos API] Fetching video: ${id}`);

  try {
    const doc = await db.collection('videos').doc(id).get();

    if (!doc.exists) {
      console.log(`[Videos API] Video not found: ${id}`);
      return NextResponse.json(
        { success: false, error: { message: `Video not found: ${id}` } },
        { status: 404 }
      );
    }

    const video = docToVideo(doc);
    console.log(`[Videos API] Found video: ${video?.originalName}`);

    return NextResponse.json({
      success: true,
      ...video,
    });
  } catch (error) {
    console.error('[Videos API] Get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  console.log(`[Videos API] Deleting video: ${id}`);

  try {
    const doc = await db.collection('videos').doc(id).get();

    if (!doc.exists) {
      console.log(`[Videos API] Video not found: ${id}`);
      return NextResponse.json(
        { success: false, error: { message: `Video not found: ${id}` } },
        { status: 404 }
      );
    }

    const videoData = doc.data()!;

    // Delete from Firebase Storage
    if (videoData.storagePath) {
      console.log(`[Videos API] Deleting from storage: ${videoData.storagePath}`);
      try {
        await storage.file(videoData.storagePath).delete();
        console.log('[Videos API] Storage file deleted');
      } catch (storageError) {
        console.error('[Videos API] Storage delete error:', storageError);
        // Continue with Firestore deletion even if storage fails
      }
    }

    // Delete Firestore document
    await db.collection('videos').doc(id).delete();
    console.log(`[Videos API] Firestore document deleted: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('[Videos API] Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
