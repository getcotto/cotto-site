import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, source } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Log the contact form submission
    console.log('Contact form submission received:', {
      name,
      email,
      message: message || '',
      source: source || 'contact_form',
      timestamp: new Date().toISOString()
    });

    // For now, just return success
    // TODO: Add email notification or database storage later
    return NextResponse.json({ 
      success: true,
      message: 'Message received successfully'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
