import Anthropic from '@anthropic-ai/sdk';
import type {
  ImproveCopyRequest,
  ImproveCopyResponse,
  AIErrorResponse,
} from '@/features/landing-editor/ai/ai.types';
import { buildImproveCopyPrompt } from '@/features/landing-editor/ai/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  if (typeof body !== 'object' || body === null || !('text' in body) || !('context' in body)) {
    return errorResponse('Missing required fields: text, context', 'invalid_request', 400);
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.text !== 'string' || raw.text.trim() === '') {
    return errorResponse("Field 'text' must be a non-empty string", 'invalid_request', 400);
  }
  if (typeof raw.context !== 'string' || raw.context.trim() === '') {
    return errorResponse("Field 'context' must be a non-empty string", 'invalid_request', 400);
  }

  const request: ImproveCopyRequest = {
    text: raw.text.trim(),
    context: raw.context.trim(),
    ...(raw.tone !== undefined && { tone: raw.tone as ImproveCopyRequest['tone'] }),
    ...(raw.tenantType !== undefined && {
      tenantType: raw.tenantType as ImproveCopyRequest['tenantType'],
    }),
    ...(typeof raw.maxLength === 'number' && { maxLength: raw.maxLength }),
  };

  // ── 2. Call Anthropic ──────────────────────────────────────────────────────
  let rawText: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildImproveCopyPrompt(request) }],
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
    !('improvedText' in parsed) ||
    !('alternatives' in parsed)
  ) {
    return errorResponse('AI response missing required fields', 'generation_failed', 422);
  }

  const result = parsed as Record<string, unknown>;

  if (typeof result.improvedText !== 'string') {
    return errorResponse("AI response 'improvedText' must be a string", 'generation_failed', 422);
  }

  if (
    !Array.isArray(result.alternatives) ||
    result.alternatives.length !== 2 ||
    !result.alternatives.every((a: unknown) => typeof a === 'string')
  ) {
    return errorResponse(
      "AI response 'alternatives' must be an array of 2 strings",
      'generation_failed',
      422
    );
  }

  const response: ImproveCopyResponse = {
    improvedText: result.improvedText,
    alternatives: result.alternatives as string[],
  };

  return Response.json(response);
}
