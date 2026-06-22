import { NextRequest, NextResponse } from "next/server";
import { trackOrderByCode } from "@/lib/tracking";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") || "";
    if (!code.trim()) {
      return NextResponse.json(
        { success: false, found: false, error: "Parameter code wajib diisi" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await trackOrderByCode(code);
    return NextResponse.json({ success: true, ...result }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Track API GET error:", error);
    return NextResponse.json(
      { success: false, found: false, error: "Terjadi kesalahan server" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body?.code || "";

    if (!code.trim()) {
      return NextResponse.json(
        { success: false, found: false, error: "Field code wajib diisi" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await trackOrderByCode(code);
    return NextResponse.json({ success: true, ...result }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Track API POST error:", error);
    return NextResponse.json(
      { success: false, found: false, error: "Terjadi kesalahan server" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
