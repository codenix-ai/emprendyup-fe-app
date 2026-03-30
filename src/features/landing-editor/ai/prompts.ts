// ─── AI Prompt Engineering ────────────────────────────────────────────────────
// Builders de prompts para los 3 endpoints de IA.
// Cada función retorna el `user` message completo listo para enviar a Claude.

import type { TenantType } from '../context/TenantContext';
import type { GenerateLandingRequest, ImproveCopyRequest, SuggestPaletteRequest } from './ai.types';

// ─── Tenant type → Spanish label ─────────────────────────────────────────────

const TENANT_LABELS: Record<TenantType, string> = {
  store: 'tienda online / e-commerce',
  restaurant: 'restaurante / delivery de comida',
  serviceProvider: 'proveedor de servicios profesionales',
};

// ─── Generate Landing ─────────────────────────────────────────────────────────

export function buildGenerateLandingPrompt(req: GenerateLandingRequest): string {
  const tenantLabel = TENANT_LABELS[req.tenantType];
  const tone = req.tone ?? 'friendly';
  const lang = req.language ?? 'es';
  const name = req.businessName ? `El negocio se llama "${req.businessName}".` : '';

  return `Eres un experto en diseño web y copywriting para negocios latinoamericanos.

Tu tarea es generar el contenido completo de una landing page para el siguiente negocio:

TIPO DE NEGOCIO: ${tenantLabel}
${name}
DESCRIPCIÓN: ${req.businessDescription}
TONO: ${tone}
IDIOMA: ${lang === 'es' ? 'Español (Argentina/LATAM)' : lang === 'pt' ? 'Portugués (Brasil)' : 'Inglés'}

Genera un JSON con esta estructura EXACTA (no agregues campos extra, no omitas ninguno):

{
  "seo": {
    "title": "<título SEO atractivo, max 60 chars>",
    "description": "<meta description, max 155 chars>",
    "keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"]
  },
  "blocks": [
    {
      "type": "NavigationBar",
      "props": {
        "logoText": "<nombre del negocio>",
        "links": [
          { "label": "<link1>", "href": "#section1" },
          { "label": "<link2>", "href": "#section2" },
          { "label": "<link3>", "href": "#section3" }
        ],
        "ctaLabel": "<texto del botón CTA>",
        "variant": "default"
      }
    },
    {
      "type": "HeroBanner",
      "props": {
        "title": "<título principal impactante, max 60 chars>",
        "subtitle": "<subtítulo que explica el valor, max 120 chars>",
        "ctaLabel": "<texto del botón principal>",
        "ctaHref": "#contacto",
        "variant": "gradient-overlay"
      }
    },
    {
      "type": "AboutSection",
      "props": {
        "title": "<título de la sección sobre nosotros>",
        "description": "<párrafo de 2-3 oraciones sobre el negocio>",
        "variant": "default"
      }
    },
    ${
      req.tenantType === 'store' || req.tenantType === 'restaurant'
        ? `{
      "type": "ProductGrid",
      "props": {
        "title": "${req.tenantType === 'restaurant' ? 'Nuestro Menú' : 'Nuestros Productos'}",
        "subtitle": "<subtítulo de la sección>",
        "variant": "grid"
      }
    },`
        : ''
    }
    {
      "type": "TestimonialsSection",
      "props": {
        "title": "Lo que dicen nuestros clientes",
        "testimonials": [
          { "name": "<nombre cliente 1>", "text": "<testimonio breve y creíble>", "role": "<rol o ciudad>" },
          { "name": "<nombre cliente 2>", "text": "<testimonio breve y creíble>", "role": "<rol o ciudad>" },
          { "name": "<nombre cliente 3>", "text": "<testimonio breve y creíble>", "role": "<rol o ciudad>" }
        ],
        "variant": "cards"
      }
    },
    {
      "type": "CTABanner",
      "props": {
        "title": "<frase de cierre motivadora>",
        "subtitle": "<subtítulo de apoyo>",
        "ctaLabel": "<texto del botón>",
        "ctaHref": "#contacto",
        "variant": "centered"
      }
    },
    {
      "type": "ContactSection",
      "props": {
        "title": "Contactanos",
        "subtitle": "<invitación a contactar>",
        "showForm": true,
        "showMap": false,
        "variant": "default"
      }
    },
    {
      "type": "FooterSection",
      "props": {
        "logoText": "<nombre del negocio>",
        "tagline": "<frase breve de cierre>",
        "copyrightText": "© ${new Date().getFullYear()} <nombre del negocio>. Todos los derechos reservados.",
        "variant": "default"
      }
    }
  ],
  "suggestedPreset": "<uno de: elegant-dark | modern-light | natural-earth | bold-vibrant | minimal-mono>",
  "reasoning": "<1 oración explicando por qué elegiste ese preset>"
}

IMPORTANTE:
- Responde ÚNICAMENTE con el JSON válido, sin markdown, sin explicaciones.
- Todo el contenido en ${lang === 'es' ? 'español (variante argentina/LATAM, tuteo)' : lang === 'pt' ? 'portugués de Brasil' : 'inglés'}.
- Los textos deben ser específicos y relevantes para el negocio, NO genéricos.
- suggestedPreset debe ser coherente con el tipo y tono del negocio.`;
}

// ─── Improve Copy ─────────────────────────────────────────────────────────────

export function buildImproveCopyPrompt(req: ImproveCopyRequest): string {
  const tone = req.tone ?? 'friendly';
  const maxLen = req.maxLength ? `\nLÍMITE: máximo ${req.maxLength} caracteres por versión.` : '';
  const tenantCtx = req.tenantType ? `\nTIPO DE NEGOCIO: ${TENANT_LABELS[req.tenantType]}` : '';

  return `Eres un experto en copywriting para negocios latinoamericanos.

CONTEXTO: ${req.context}${tenantCtx}
TONO DESEADO: ${tone}${maxLen}

TEXTO ORIGINAL:
"${req.text}"

Mejora este texto y genera 3 versiones (la principal + 2 alternativas).

Responde ÚNICAMENTE con este JSON válido:
{
  "improvedText": "<versión principal mejorada>",
  "alternatives": [
    "<alternativa 1>",
    "<alternativa 2>"
  ]
}

Las versiones deben:
- Mantener el mismo significado pero ser más impactantes
- Usar lenguaje natural en español (Argentina/LATAM)
- Ser concisas y orientadas a conversión
- Respetar el límite de caracteres si se indicó`;
}

// ─── Suggest Palette ──────────────────────────────────────────────────────────

export function buildSuggestPalettePrompt(req: SuggestPaletteRequest): string {
  const tenantCtx = req.tenantType ? `\nTIPO DE NEGOCIO: ${TENANT_LABELS[req.tenantType]}` : '';
  const mood = req.mood ? `\nMOOD: ${req.mood}` : '';

  return `Eres un experto en diseño visual y branding para negocios latinoamericanos.

DESCRIPCIÓN DEL NEGOCIO: ${req.businessDescription}${tenantCtx}${mood}

Los temas disponibles son:
- "elegant-dark": oro sobre fondo negro, fuente Playfair Display. Para negocios de lujo, fine dining, moda premium.
- "modern-light": índigo sobre blanco, fuente Inter. Para SaaS, tecnología, servicios profesionales modernos.
- "natural-earth": marrón tierra sobre crema, fuente Lora. Para orgánicos, gastronomía artesanal, bienestar, naturaleza.
- "bold-vibrant": rosa fucsia sobre blanco cálido, fuente Montserrat. Para marcas juveniles, fitness, entretenimiento.
- "minimal-mono": negro sobre gris muy claro, fuente Space Grotesk. Para portfolios, arquitectura, diseño, tech minimalista.

Elige el tema más apropiado y explica brevemente por qué.

Responde ÚNICAMENTE con este JSON válido:
{
  "preset": "<nombre-del-preset>",
  "reasoning": "<1-2 oraciones explicando la elección en español>"
}`;
}
