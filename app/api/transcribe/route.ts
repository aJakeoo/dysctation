import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

// In-memory per-instance rate limit store: IP -> request timestamps within
// the current window. This resets on cold starts and is not shared across
// serverless instances, so it is a best-effort limit rather than a hard
// global cap -- acceptable at this app's scale, and avoids pulling in an
// external store (e.g. Redis) for a single low-traffic route.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GROQ_API_KEY." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const audio = formData.get("audio");

  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json(
      { error: "No audio file provided." },
      { status: 400 }
    );
  }

  try {
    const groq = new Groq({ apiKey });
    const file = new File([audio], "recording.webm", {
      type: audio.type || "audio/webm",
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text.trim() });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 502 }
    );
  }
}
