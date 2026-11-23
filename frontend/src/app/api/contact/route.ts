import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request payload.' }, { status: 400 });
  }

  // Honeypot field: bots filling hidden field get a silent 200 without processing
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true, message: 'Message received.' });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ ok: false, message: 'Please enter your name (2–100 characters).' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 160) {
    return NextResponse.json({ ok: false, message: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (subject.length < 3 || subject.length > 150) {
    return NextResponse.json({ ok: false, message: 'Please enter a subject (3–150 characters).' }, { status: 400 });
  }
  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json({ ok: false, message: 'Please enter a message (10–2000 characters).' }, { status: 400 });
  }

  console.info('[contact-form]', {
    subject: subject.slice(0, 80),
    messageLength: message.length,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    message: 'Thank you. Your inquiry has been recorded. For urgent copyright matters, also email dmca@reelfetch.com.',
  });
}
