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

    // Send to Klaviyo API
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
      return NextResponse.json(
        { error: 'Failed to submit to Klaviyo' },
        { status: 500 }
      );
    }

    // Also send a track event for contact form submission
    await fetch('https://a.klaviyo.com/api/v2/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: process.env.KLAVIYO_PUBLIC_API_KEY,
        event: 'Contact Form Submitted',
        customer_properties: {
          $email: email,
          $first_name: name.split(' ')[0],
          $last_name: name.split(' ').slice(1).join(' ') || '',
        },
        properties: {
          source: source || 'contact_form',
          message: message || '',
          contact_date: new Date().toISOString(),
        }
      }),
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
