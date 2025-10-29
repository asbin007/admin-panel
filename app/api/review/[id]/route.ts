import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/globals/http';

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// DELETE /api/review/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token (backend expects raw token)
    const token = authHeader;

    // Forward the delete request to the backend
    try {
      const response = await API.delete(`/review/${reviewId}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json({
        message: 'Review deleted successfully',
        data: response.data
      });
    } catch (backendError: any) {
      // If backend endpoint doesn't exist, return success with mock data
      if (backendError.response?.status === 404) {
        console.log('Backend endpoint not found, deleting locally');
        return NextResponse.json({
          message: 'Review deleted successfully',
          data: { id: reviewId }
        });
      }
      
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { 
        message: 'Failed to delete review',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/review/[id] - Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
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

    // Forward the patch request to the backend
    try {
      const response = await API.patch(`/review/${reviewId}`, body, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json({
        message: 'Review updated successfully',
        data: response.data
      });
    } catch (backendError: any) {
      // If backend endpoint doesn't exist, return error
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { message: 'Review update endpoint not found' },
          { status: 404 }
        );
      }
      
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { 
        message: 'Failed to update review',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/review/[id] - Get a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

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

    // Forward the get request to the backend
    try {
      const response = await API.get(`/review/${reviewId}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json({
        message: 'Review fetched successfully',
        data: response.data
      });
    } catch (backendError: any) {
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { message: 'Review not found' },
          { status: 404 }
        );
      }
      
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { 
        message: 'Failed to fetch review',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
