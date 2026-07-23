import { NextResponse } from "next/server";

const ENDPOINT = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

export async function GET(request) {
  const input = request.nextUrl.searchParams.get("input")?.trim();
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!input) return NextResponse.json({ enabled: Boolean(key), suggestions: [] });
  if (!key) return NextResponse.json({ enabled: false, suggestions: [] });

  const params = new URLSearchParams({
    input,
    key,
    components: "country:in",
    location: "18.5204,73.8567",
    radius: "50000",
    strictbounds: "true",
    types: "geocode",
    language: "en",
    sessiontoken: request.nextUrl.searchParams.get("sessiontoken") || ""
  });

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !["OK", "ZERO_RESULTS"].includes(data.status)) {
      return NextResponse.json({ suggestions: [], error: "Places lookup unavailable" }, { status: 502 });
    }
    const suggestions = (data.predictions || []).map(({ description, place_id: id }) => ({ id, label: description }));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [], error: "Places lookup unavailable" }, { status: 502 });
  }
}
