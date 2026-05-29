import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === cronSecret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  const webhookUrl = process.env.BACKUP_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return NextResponse.json(
      {
        success: false,
        error:
          "BACKUP_WEBHOOK_URL is missing. Vercel cron cannot run pg_dump directly; point this to a backup runner endpoint.",
      },
      { status: 500 }
    );
  }

  const webhookToken = process.env.BACKUP_WEBHOOK_TOKEN?.trim();

  let upstreamStatus = 0;
  let upstreamBody = "";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
      },
      body: JSON.stringify({ source: "vercel-cron", timestamp: new Date().toISOString() }),
      cache: "no-store",
    });

    upstreamStatus = response.status;
    upstreamBody = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Backup runner request failed",
          upstreamStatus,
          upstreamBody,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Backup runner triggered successfully",
      upstreamStatus,
      upstreamBody,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger backup runner",
        detail: message,
      },
      { status: 500 }
    );
  }
}
