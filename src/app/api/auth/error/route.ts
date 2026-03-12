import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const errorUri = url.searchParams.get('error_uri');

  // Redirect back to register page with error message
  const redirectUrl = new URL('/registrarse', req.url);
  if (error) {
    redirectUrl.searchParams.set('error', `oauth_error: ${error}`);
    if (errorDescription) {
      redirectUrl.searchParams.set('error_description', errorDescription);
    }
  }

  return NextResponse.redirect(redirectUrl);
}
