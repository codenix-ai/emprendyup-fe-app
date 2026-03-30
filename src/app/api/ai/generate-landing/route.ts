import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerateLandingRequest,
  GenerateLandingResponse,
  AIErrorResponse,
} from '@/features/landing-editor/ai/ai.types';
import { buildGenerateLandingPrompt } from '@/features/landing-editor/ai/prompts';
import type {
  LandingPageJSON,
  LandingBlock,
  CraftSerializedNodes,
  ThemePreset,
  LandingSEO,
} from '@/lib/landing-renderer/types/landing-json.schema';
import { THEME_PRESETS, DEFAULT_THEME } from '@/features/landing-editor/theme';

// ─── Parsed AI output shape ───────────────────────────────────────────────────

interface AIGeneratedBlock {
  type: string;
  props: Record<string, unknown>;
}

interface AIGeneratedOutput {
  seo: LandingSEO;
  blocks: AIGeneratedBlock[];
  suggestedPreset: string;
  reasoning?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidRequest(body: unknown): body is GenerateLandingRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.businessDescription === 'string' &&
    b.businessDescription.trim().length > 0 &&
    typeof b.tenantId === 'string' &&
    b.tenantId.trim().length > 0 &&
    typeof b.tenantSlug === 'string' &&
    b.tenantSlug.trim().length > 0 &&
    typeof b.tenantType === 'string' &&
    b.tenantType.trim().length > 0
  );
}

// ─── JSON extraction — strips markdown code fences if present ─────────────────

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

// ─── POST /api/ai/generate-landing ───────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      {
        error: 'El cuerpo de la solicitud no es JSON válido.',
        code: 'invalid_request',
      } satisfies AIErrorResponse,
      { status: 400 }
    );
  }

  if (!isValidRequest(body)) {
    return Response.json(
      {
        error:
          'Faltan campos requeridos: businessDescription, tenantId, tenantSlug y tenantType son obligatorios.',
        code: 'invalid_request',
      } satisfies AIErrorResponse,
      { status: 400 }
    );
  }

  const validatedRequest: GenerateLandingRequest = body;
  const prompt = buildGenerateLandingPrompt(validatedRequest);

  try {
    // 2. Call Anthropic API
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    // 3. Extract text content from the first content block
    const firstBlock = message.content[0];
    if (!firstBlock || firstBlock.type !== 'text') {
      return Response.json(
        {
          error: 'La IA no pudo generar un JSON válido. Intenta con una descripción más detallada.',
          code: 'generation_failed',
        } satisfies AIErrorResponse,
        { status: 422 }
      );
    }

    // 4. Parse JSON — strip any markdown fences
    let parsed: AIGeneratedOutput;
    try {
      const jsonText = extractJSON(firstBlock.text);
      parsed = JSON.parse(jsonText) as AIGeneratedOutput;
    } catch {
      return Response.json(
        {
          error: 'La IA no pudo generar un JSON válido. Intenta con una descripción más detallada.',
          code: 'generation_failed',
        } satisfies AIErrorResponse,
        { status: 422 }
      );
    }

    // 5. Build LandingPageJSON from parsed AI output
    const resolvedPreset = parsed.suggestedPreset as Exclude<ThemePreset, 'custom'>;
    const landing: LandingPageJSON = {
      version: '2.0',
      tenantId: validatedRequest.tenantId,
      tenantSlug: validatedRequest.tenantSlug,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      seo: parsed.seo,
      theme: {
        ...(THEME_PRESETS[resolvedPreset] ?? DEFAULT_THEME),
        preset: parsed.suggestedPreset as ThemePreset,
      },
      craftState: {} as CraftSerializedNodes, // empty — editor will initialize
      blocks: (parsed.blocks as Array<{ type: string; props: Record<string, unknown> }>).map(
        (b, i): LandingBlock => ({
          id: `ai-${b.type.toLowerCase()}-${i}`,
          type: b.type as LandingBlock['type'],
          variant: (b.props.variant as string) ?? 'default',
          visible: true,
          order: i,
          props: b.props,
        })
      ),
    };

    // 6. Return success response
    return Response.json({
      landing,
      suggestedPreset: parsed.suggestedPreset as ThemePreset,
      generationId: crypto.randomUUID(),
    } satisfies GenerateLandingResponse);
  } catch (err: unknown) {
    // Anthropic rate-limit error
    if (
      err instanceof Anthropic.RateLimitError ||
      (err instanceof Anthropic.APIError && err.status === 429)
    ) {
      return Response.json(
        {
          error:
            'Se ha superado el límite de solicitudes a la IA. Por favor, intenta en unos minutos.',
          code: 'rate_limit',
        } satisfies AIErrorResponse,
        { status: 429 }
      );
    }

    // Unexpected server error — no stack traces, no API key exposure
    return Response.json(
      { error: 'Error interno del servidor.', code: 'server_error' } satisfies AIErrorResponse,
      { status: 500 }
    );
  }
}
