import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/globals/http';

// GET /api/review - Get all reviews
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token (backend expects raw token)
    const token = authHeader;

    // Forward the get request to the backend
    try {
      const response = await API.get('/review', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json({
        message: 'Reviews fetched successfully',
        data: response.data.data || response.data || []
      });
    } catch (backendError: any) {
      // If backend endpoint doesn't exist, return empty array
      if (backendError.response?.status === 404 || backendError.response?.status === 500) {
        console.log('Backend endpoint not available, returning empty reviews');
        return NextResponse.json({
          message: 'Reviews fetched successfully',
          data: []
        });
      }
      
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { 
        message: 'Failed to fetch reviews',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/review - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader;

    // Forward the post request to the backend
    try {
      const response = await API.post('/review', body, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json({
        message: 'Review created successfully',
        data: response.data
      });
    } catch (backendError: any) {
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { message: 'Review creation endpoint not found' },
          { status: 404 }
        );
      }
      
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { 
        message: 'Failed to create review',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
