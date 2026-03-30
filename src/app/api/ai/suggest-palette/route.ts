import Anthropic from '@anthropic-ai/sdk';
import type {
  SuggestPaletteRequest,
  SuggestPaletteResponse,
  AIErrorResponse,
} from '@/features/landing-editor/ai/ai.types';
import type { ThemePreset } from '@/lib/landing-renderer/types/landing-json.schema';
import { buildSuggestPalettePrompt } from '@/features/landing-editor/ai/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_PRESETS: ReadonlySet<ThemePreset> = new Set<ThemePreset>([
  'elegant-dark',
  'modern-light',
  'natural-earth',
  'bold-vibrant',
  'minimal-mono',
  'custom',
]);

const FALLBACK_PRESET: ThemePreset = 'modern-light';

function isValidPreset(value: unknown): value is ThemePreset {
  return typeof value === 'string' && VALID_PRESETS.has(value as ThemePreset);
}

function errorResponse(message: string, code: AIErrorResponse['code'], status: number): Response {
  const body: AIErrorResponse = { error: message, code };
  return Response.json(body, { status });
}

export async function POST(req: Request): Promise<Response> {
  // ── 1. Parse & validate request body ──────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Request body must be valid JSON', 'invalid_request', 400);
  }

  if (typeof body !== 'object' || body === null || !('businessDescription' in body)) {
    return errorResponse('Missing required field: businessDescription', 'invalid_request', 400);
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.businessDescription !== 'string' || raw.businessDescription.trim() === '') {
    return errorResponse(
      "Field 'businessDescription' must be a non-empty string",
      'invalid_request',
      400
    );
  }

  const request: SuggestPaletteRequest = {
    businessDescription: raw.businessDescription.trim(),
    ...(raw.tenantType !== undefined && {
      tenantType: raw.tenantType as SuggestPaletteRequest['tenantType'],
    }),
    ...(raw.mood !== undefined && { mood: raw.mood as SuggestPaletteRequest['mood'] }),
  };

  // ── 2. Call Anthropic ──────────────────────────────────────────────────────
  let rawText: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: buildSuggestPalettePrompt(request) }],
    });
    rawText = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch {
    return errorResponse('AI service unavailable', 'server_error', 500);
  }

  // ── 3. Parse & validate JSON response ─────────────────────────────────────
  let parsed: unknown;
  try {
    const clean = rawText
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim();
    parsed = JSON.parse(clean);
  } catch {
    return errorResponse('Failed to parse AI response', 'generation_failed', 422);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('preset' in parsed) ||
    !('reasoning' in parsed)
  ) {
    return errorResponse('AI response missing required fields', 'generation_failed', 422);
  }

  const result = parsed as Record<string, unknown>;

  if (typeof result.reasoning !== 'string') {
    return errorResponse("AI response 'reasoning' must be a string", 'generation_failed', 422);
  }

  // Fallback to "modern-light" if preset is not a valid ThemePreset value
  const preset: ThemePreset = isValidPreset(result.preset) ? result.preset : FALLBACK_PRESET;

  const response: SuggestPaletteResponse = {
    preset,
    reasoning: result.reasoning,
  };

  return Response.json(response);
}
