/**
 * Chat History API Route
 * GET /api/chat/history?conversationId=xxx&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, timestampToDate } from '@/lib/services/firebase-admin';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: { message: 'conversationId is required' } },
      { status: 400 }
    );
  }

  console.log(`[Chat API] Fetching history for conversation: ${conversationId}`);

  try {
    const doc = await db.collection('conversations').doc(conversationId).get();

    if (!doc.exists) {
      return NextResponse.json({
        conversationId,
        messages: [],
      });
    }

    const data = doc.data()!;
    const messages = (data.messages || []).slice(-limit);

    return NextResponse.json({
      conversationId,
      messages: messages.map((m: { role: string; content: string; timestamp?: unknown }) => ({
        role: m.role,
        content: m.content,
        timestamp: timestampToDate(m.timestamp as unknown as undefined),
      })),
      createdAt: timestampToDate(data.createdAt),
    });
  } catch (error) {
    console.error('[Chat API] Error fetching history:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
