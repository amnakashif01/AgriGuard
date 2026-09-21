import { NextRequest, NextResponse } from 'next/server';
import { marketplaceAgent } from '@/ai/flows/marketplace-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'search':
        const { query, location, filters } = data;
        
        if (!query || !location?.lat || !location?.lng) {
          return NextResponse.json(
            { error: 'Missing required fields: query, location (lat, lng)' },
            { status: 400 }
          );
        }

        const result = await marketplaceAgent({
          query,
          location: {
            lat: location.lat,
            lng: location.lng,
            radius: location.radius || 50
          },
          filters
        });

        return NextResponse.json(result);

      case 'seed':
        // Seed suppliers to Firestore (no longer needed, uses external API)
        return NextResponse.json({ success: true, message: 'Seeding no longer required. Using live external APIs.' });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: search, seed' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '50');
    const query = searchParams.get('query') || 'agricultural supplies';

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    const result = await marketplaceAgent({
      query,
      location: { lat, lng, radius },
      filters: {}
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
