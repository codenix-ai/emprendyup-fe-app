import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_API = 'https://api.unsplash.com';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const page = req.nextUrl.searchParams.get('page') ?? '1';
  const per_page = '20';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: 'Unsplash not configured. Set UNSPLASH_ACCESS_KEY in environment variables.' },
      { status: 503 }
    );
  }

  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 300 }, // cache for 5 min
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Unsplash API error: ${res.status}` },
      { status: res.status }
    );
  }

  const json = (await res.json()) as {
    results: Array<{
      id: string;
      urls: { thumb: string; small: string; regular: string; full: string };
      alt_description: string | null;
      user: { name: string; links: { html: string } };
      links: { html: string };
    }>;
    total_pages: number;
  };

  // Return only what the UI needs — shape matches PickerPhoto from UnsplashPicker component
  const results = json.results.map((p) => ({
    id: p.id,
    url: p.urls.regular,
    thumbUrl: p.urls.small,
    alt: p.alt_description ?? '',
    author: p.user.name,
  }));

  return NextResponse.json({ results, totalPages: json.total_pages });
}
