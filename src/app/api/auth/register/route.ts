import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, storeId, role } = body;

    // Validate required input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password length (backend requirement)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Optional confirmation check (UI may send it)
    if (typeof confirmPassword === 'string' && confirmPassword !== password) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // Get backend URL
    const backendUrl = process.env.AUTH_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend not configured' }, { status: 500 });
    }

    // Prepare the registration data
    const registerData: any = {
      name,
      email,
      password,
    };

    // Only add storeId if it's provided and not empty
    if (storeId && storeId.trim() !== '') {
      registerData.storeId = storeId;
    }

    // Add role if provided
    if (role) registerData.role = role;

    // Call your backend register endpoint
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend registration failed:', data);
      return NextResponse.json(
        { error: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    // Get the token from your backend response
    const token = data.accessToken;

    // Create response
    const nextResponse = NextResponse.json({
      success: true,
      user: data,
      message: 'Registration successful',
    });

    // Set cookie if token is provided
    if (token) {
      nextResponse.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
