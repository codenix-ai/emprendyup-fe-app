# LANDING_EDITOR_PREVIEW_FIX.md

> Tarea para agente: hacer que todos los fields del editor se reflejen en el preview.

## Contexto técnico

- **Framework:** Next.js (Turbopack, App Router)
- **Archivo principal del editor:** `src/app/dashboard/landing-editor/page.tsx`
- **Componente del panel editor:** `src/app/components/LandingEditor/index.tsx`
- **Componente del panel de secciones:** `src/app/components/LandingEditor/DraftSectionPanel.tsx`
- **Componente del preview:** `src/app/components/LandingEditor/LandingPreview.tsx` ← **FOCO PRINCIPAL**
- **Tipos:** `src/app/components/LandingEditor/types.ts`
- **Estado persistido:** `localStorage['landing_draft']` (objeto con claves: `seo`, `hero`, `menu`, `about`, `theme`, `footer`, `contact`, `gallery`, `branding`, `navigation`, `testimonials`, `reservationForm`)

---

## Regla general

En `LandingPreview.tsx`, cada sección recibe los datos del draft y los renderiza.  
El problema es que **varios campos del draft no están siendo leídos ni renderizados** en el JSX del preview.  
No hay que tocar el editor (los datos ya existen y son correctos). Solo hay que arreglar el **preview**.

---

## ISSUE 1 — Sección `about` (Sobre Nosotros)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** La sección renderiza únicamente el `title`. Todo lo demás está vacío.

**Estructura de datos disponible en `draft.about`:**

```ts
{
  title: string,            // "Sobre Nosotras" ✅ ya se muestra
  subtitle: string,         // "Nuestra historia y misión" ❌ falta
  paragraphs: string[],     // 3 párrafos con el texto completo ❌ falta
  paragraphs2: string[],    // 2 párrafos adicionales ❌ falta
  images: { id: string, alt: string }[],  // 2 imágenes ❌ falta
  stats: any[],             // vacío actualmente, renderizar si tiene items
  titleStyle: CSSProperties,
  subtitleStyle: CSSProperties,
  paragraphStyle: CSSProperties,
  paragraph2Style: CSSProperties,
  backgroundColor: string,  // "#fff6e9"
}
```

**Cambios requeridos en el preview de `about`:**

1. Aplicar `backgroundColor` al contenedor de la sección.
2. Renderizar `<h2 style={titleStyle}>{about.title}</h2>`.
3. Renderizar `<p style={subtitleStyle}>{about.subtitle}</p>`.
4. Iterar `about.paragraphs` → `<p style={paragraphStyle}>{p}</p>`.
5. Iterar `about.paragraphs2` → `<p style={paragraph2Style}>{p}</p>`.
6. Iterar `about.images` → `<img src={resolveImageUrl(img.id)} alt={img.alt} />` (usar la misma función que resuelve URLs de imágenes del hero/galería).
7. Si `about.stats.length > 0`, renderizar cada stat.

---

## ISSUE 2 — Sección `gallery` (Galería)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** Las imágenes se muestran como texto plano (solo el `alt`). El `subtitle` no aparece. Los estilos no se aplican.

**Estructura de datos disponible en `draft.gallery`:**

```ts
{
  title: string,         // "Galería" ✅ ya se muestra
  subtitle: string,      // "Lo mas popular" ❌ falta
  images: { id: string, alt: string }[],  // 4 imágenes con IDs de S3 ❌ falta (se muestra solo el alt)
  titleStyle: CSSProperties,
  subtitleStyle: CSSProperties,
  backgroundColor: string,  // "#fafle4"
}
```

**Cambios requeridos:**

1. Aplicar `backgroundColor` al contenedor.
2. Aplicar `titleStyle` al `<h2>`.
3. Renderizar `<p style={subtitleStyle}>{gallery.subtitle}</p>`.
4. Cambiar el render de imágenes: en vez de mostrar el `alt` como texto, renderizar `<img src={resolveImageUrl(img.id)} alt={img.alt} />`.

---

## ISSUE 3 — Sección `reservationForm` (Formulario de Reserva)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** El formulario solo muestra el título y el botón de envío. Los campos de input (nombre, email, mensaje) no se renderizan.

**Estructura de datos disponible en `draft.reservationForm`:**

```ts
{
  title: string,           // "Formulario de Contacto" ✅ ya se muestra
  fields: {
    name: string,          // "Nombre" ❌ falta el input
    email: string,         // "Correo Electrónico" ❌ falta el input
    message: string,       // "Mensaje" ❌ falta el textarea
  },
  submitButton: string,    // "Enviar" ✅ ya se muestra
  submittingButton: string,// "Enviando..." ❌ falta (estado loading)
  successMessage: string,  // "¡Gracias por contactarnos!..." ❌ falta
  errorMessage: string,    // "Hubo un error al enviar..." ❌ falta
}
```

**Cambios requeridos:**

1. Renderizar un `<input type="text" placeholder={fields.name} />` o `<label>` + `<input>`.
2. Renderizar un `<input type="email" placeholder={fields.email} />`.
3. Renderizar un `<textarea placeholder={fields.message} />`.
4. En el preview (modo solo lectura) los campos pueden ser no-funcionales (disabled o read-only), pero deben **verse** para reflejar la configuración.
5. El botón ya está pero conviene que use `submitButton` del draft (verificar que lo lee).

---

## ISSUE 4 — Sección `contact` (Contacto)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** Solo se muestran `email`, `phone` y `address`. Faltan varios campos.

**Estructura de datos disponible en `draft.contact`:**

```ts
{
  title: string,       // "Contáctanos" ✅
  subtitle: string,    // "Estamos aquí para ayudarte" ❌ falta
  email: string,       // ✅
  phone: string,       // ✅
  address: { city: string, country: string },  // ✅
  hours: {             // ❌ falta completamente
    monday: string, tuesday: string, wednesday: string,
    thursday: string, friday: string, saturday: string, sunday: string
  },
  social: {            // ❌ falta completamente
    instagram: string, // "https://www.instagram.com/twinsstore_aym/"
    tiktok: string,
    youtube: string,
  },
  buttons: { link: string, text: string, textColor: string, backgroundColor: string }[], // ❌ falta
  titleStyle: CSSProperties,
  subtitleStyle: CSSProperties,
  backgroundColor: string,  // "#fff6e9"
}
```

**Cambios requeridos:**

1. Aplicar `backgroundColor` al contenedor.
2. Aplicar `titleStyle` al `<h2>`.
3. Renderizar `<p style={subtitleStyle}>{contact.subtitle}</p>`.
4. Renderizar la lista de horarios de `hours` (iterar las claves del objeto).
5. Renderizar los links de `social` que no estén vacíos (mostrar ícono o texto con `<a href>`).
6. Renderizar `buttons` → `<a href={btn.link} style={{color: btn.textColor, backgroundColor: btn.backgroundColor}}>{btn.text}</a>`.

---

## ISSUE 5 — Sección `testimonials` (Testimonios)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** Se muestra el título y el texto/nombre de cada testimonio, pero falta información de cada card.

**Estructura de datos disponible en `draft.testimonials`:**

```ts
{
  title: string,        // "Testimonios" ✅
  subtitle: string,     // "Lo que nuestros clientes dicen" ❌ falta
  titleStyle: CSSProperties,
  subtitleStyle: CSSProperties,
  backgroundColor: string,  // "#faf1e4"
  items: Array<{
    name: string,       // ✅ se muestra
    text: string,       // ✅ se muestra (la cita)
    image: { id: string, alt: string },  // ❌ falta el avatar
    stars: number,      // 5 ❌ falta la representación visual (★★★★★)
    author: string,     // campo extra ❌ falta
    content: string,    // campo extra ❌ falta
  }>
}
```

**Cambios requeridos:**

1. Aplicar `backgroundColor` al contenedor.
2. Aplicar `subtitleStyle` y renderizar `<p>{testimonials.subtitle}</p>`.
3. En cada card de testimonio:
   - Renderizar `<img src={resolveImageUrl(item.image.id)} alt={item.image.alt} />` (avatar).
   - Renderizar las estrellas: `'★'.repeat(item.stars)` o componente de estrellas.

---

## ISSUE 6 — Sección `menu` (Productos)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** Se muestran los items (nombre y precio), pero faltan el subtitle, descriptions y el botón CTA.

**Estructura de datos disponible en `draft.menu`:**

```ts
{
  title: string,       // "Productos" ✅
  subtitle: string,    // "Joyas, Camisetas y Buzos" ❌ falta
  titleStyle: CSSProperties,
  subtitleStyle: CSSProperties,
  backgroundColor: string,  // "#fff6e9"
  items: Array<{
    name: string,        // ✅
    price: string,       // ✅
    description: string, // ❌ falta en las tarjetas
    image: { id: string, alt: string },  // ❌ las tarjetas muestran "Sin imagen" siempre
  }>,
  buttons: Array<{       // ❌ falta el botón CTA de la sección
    link: string,        // "/products"
    text: string,        // "Ver colecciones"
    textColor: string,
    backgroundColor: string,
  }>,
}
```

**Cambios requeridos:**

1. Aplicar `backgroundColor` al contenedor.
2. Aplicar `subtitleStyle` y renderizar `<p>{menu.subtitle}</p>`.
3. En cada tarjeta de producto, renderizar `item.description`.
4. Para la imagen de cada producto: intentar resolver `item.image.id` con `resolveImageUrl()`. Si falla o está vacío, mantener el placeholder "Sin imagen".
5. Renderizar los `buttons` de la sección como CTAs debajo de la grilla de productos.

---

## ISSUE 7 — Footer

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** El footer tiene estilos hardcodeados y no muestra el `aboutText`. El `copyrightText` tampoco usa el del draft.

**Estructura de datos disponible en `draft.footer`:**

```ts
{
  aboutText: string,      // "Twins Store AyM ofrece joyería y camisetas..." ❌ falta
  copyrightText: string,  // "© 2025 Twins Store AyM. Todos los derechos reservados." ❌ falta (el preview tiene hardcodeado "© 2026 · Todos los derechos reservados")
  style: {
    backgroundColor: string,  // "#696561"
    textColor: string,         // "#fff6e9"
    linkColor: string,         // "#fff6e9"
    fontFamily: string,        // "Open Sans, sans-serif"
    fontSize: string,          // "14px"
  }
}
```

**Cambios requeridos:**

1. Aplicar `footer.style.backgroundColor`, `textColor`, `fontFamily`, `fontSize` al contenedor del footer.
2. Renderizar `<p>{footer.aboutText}</p>`.
3. Reemplazar el copyright hardcodeado por `{footer.copyrightText}`.

---

## ISSUE 8 — Navegación

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** El botón de acción del nav dice "Ingresar" en vez del texto configurado. Los estilos del nav no se aplican.

**Estructura de datos disponible en `draft.navigation`:**

```ts
{
  items: Array<{ label: string, target: string, action: string }>,  // ✅ se muestran
  reserveButtonText: string,  // "Contáctanos" ❌ el nav muestra "Ingresar"
  style: {
    backgroundColor: string,  // "#fff5e8"
    textColor: string,         // "#000000"
    fontFamily: string,        // "Montserrat, sans-serif"
    fontSize: string,          // "14px"
    hoverColor: string,        // "#F59E0B"
  }
}
```

**Cambios requeridos:**

1. Aplicar `navigation.style.backgroundColor` al navbar.
2. Aplicar `navigation.style.textColor` y `fontFamily` a los links.
3. Reemplazar el botón "Ingresar" por `{navigation.reserveButtonText}`.

---

## ISSUE 9 — Hero Banner

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** Los controles de posición del contenido y el toggle "Mostrar sección" no están conectados.

**Notas:** Los campos `overlayOpacity`, `contentPosition`, `backgroundColor` y `show/visible` del hero **no están en el draft actual** → el editor los controla en su estado local pero no los persiste en `landing_draft`. Verificar en `DraftSectionPanel.tsx` o `index.tsx` si existen en el estado del componente y pasarlos al preview via props.

**Cambios requeridos:**

1. Si el campo `show` / `visible` existe en el estado del hero del editor, pasarlo como prop al preview y renderizar condicionalmente la sección.
2. Conectar `contentPosition` (horizontal: left/center/right, vertical: top/center/bottom) a las clases CSS o estilos del flex container del hero.
3. Conectar `overlayOpacity` al `opacity` del overlay de la imagen de fondo.
4. Conectar `backgroundColor` del hero al fondo cuando no hay imagen.

---

## ISSUE 10 — Branding (Marca)

**Archivo:** `src/app/components/LandingEditor/LandingPreview.tsx`  
**Problema:** `tagline` y `description` no se muestran en ninguna parte del preview.

**Estructura de datos disponible en `draft.branding`:**

```ts
{
  name: string,        // "Twins Store AyM" ✅ en nav y footer
  logo: { url: string, alt: string, width: string }, // ✅ en nav
  tagline: string,     // "Joyas y camisetas con propósito" ❌ no aparece en ningún lado
  description: string, // "Vendemos joyeria y camisetas con proposito cristiano" ❌ no aparece
}
```

**Cambios requeridos:**

1. Renderizar `branding.tagline` debajo del nombre de la marca en el footer o en el header/hero.
2. Considerar mostrar `branding.description` en el footer o como meta-descripción visible.

---

## Función auxiliar `resolveImageUrl`

En varios issues se necesita convertir un `image.id` a una URL pública. Verificar en el codebase si ya existe una función así (puede estar en `src/lib/` o en `LandingPreview.tsx`). Si no existe, crearla:

```ts
function resolveImageUrl(id: string): string {
  if (!id) return '';
  if (id.startsWith('http')) return id;
  // IDs de S3 tienen formato "store_images/..."
  return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${id}`;
}
```

---

## Checklist de verificación

Después de cada cambio, confirmar en el preview que:

- [ ] **Sobre Nosotros:** muestra subtitle, 3 párrafos, 2 párrafos secundarios, 2 imágenes, fondo color
- [ ] **Galería:** muestra imágenes reales (no texto alt), subtitle, fondo color
- [ ] **Formulario:** muestra inputs de nombre, email y mensaje (aunque sean read-only)
- [ ] **Contacto:** muestra subtitle, horarios, link de Instagram, botón CTA
- [ ] **Testimonios:** muestra subtitle, estrellas, avatares en cada card
- [ ] **Productos:** muestra subtitle, description en cada tarjeta, botón "Ver colecciones"
- [ ] **Footer:** muestra aboutText, usa copyrightText del draft, aplica estilos (fondo #696561)
- [ ] **Navegación:** botón de acción dice "Contáctanos" (no "Ingresar"), fondo #fff5e8
- [ ] **Marca:** tagline visible en alguna parte de la página
- [ ] **Hero:** overlay opacity funciona, posición del contenido funciona
