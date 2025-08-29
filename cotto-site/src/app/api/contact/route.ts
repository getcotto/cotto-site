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

    // Try to send to Klaviyo if API key is available
    if (process.env.KLAVIYO_PRIVATE_API_KEY) {
      try {
        const klaviyoResponse = await fetch('https://a.klaviyo.com/api/v2/list/XzK9Yw/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`,
          },
          body: JSON.stringify({
            profiles: [{
              email: email,
              $first_name: name.split(' ')[0],
              $last_name: name.split(' ').slice(1).join(' ') || '',
              $source: source || 'contact_form',
              message: message || '',
              contact_date: new Date().toISOString(),
            }]
          }),
        });

        if (!klaviyoResponse.ok) {
          console.error('Klaviyo API error:', await klaviyoResponse.text());
        }
      } catch (klaviyoError) {
        console.error('Klaviyo API error:', klaviyoError);
        // Continue execution even if Klaviyo fails
      }
    }

    // Log the contact form submission for now
    console.log('Contact form submission:', {
      name,
      email,
      message,
      source,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
