import { NextResponse } from "next/server";
import {
  groqSetupHint,
  useGroqRecommendations,
} from "@/lib/recommendation-engine";

export const dynamic = "force-dynamic";

/**
 * Lets the client show whether titles come from Groq vs Open Library subjects.
 */
export async function GET() {
  const groq = useGroqRecommendations();
  return NextResponse.json({
    engine: groq ? ("groq" as const) : ("openlibrary" as const),
    setupHint: groqSetupHint(),
  });
}
