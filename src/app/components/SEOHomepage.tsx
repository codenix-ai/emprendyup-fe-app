'use client';
import Head from 'next/head';

const SEOHomepage = () => {
  return (
    <Head>
      {/* Additional Homepage-specific meta tags */}
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <meta name="googlebot" content="index, follow" />

      {/* Geo-targeting for Latin America */}
      <meta name="geo.region" content="CO" />
      <meta name="geo.placename" content="Colombia" />
      <meta name="geo.position" content="4.570868;-74.297333" />
      <meta name="ICBM" content="4.570868, -74.297333" />

      {/* Business/Local SEO */}
      <meta property="business:contact_data:street_address" content="Bogotá, Colombia" />
      <meta property="business:contact_data:locality" content="Bogotá" />
      <meta property="business:contact_data:region" content="Cundinamarca" />
      <meta property="business:contact_data:postal_code" content="110111" />
      <meta property="business:contact_data:country_name" content="Colombia" />

      {/* Additional structured data for services */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': 'https://www.emprendyup.com/#webpage',
            url: 'https://www.emprendyup.com/',
            name: 'Emprendy.ai - Herramientas ideales para emprendedores que buscan crecer.',
            description:
              'Plataforma todo-en-uno para emprendedores: tienda online, marketplace colaborativo, CRM, IA para contenido, chatbot WhatsApp y comunidad',
            inLanguage: 'es-ES',
            isPartOf: {
              '@type': 'WebSite',
              '@id': 'https://www.emprendyup.com/#website',
              url: 'https://www.emprendyup.com/',
              name: 'Emprendy.ai',
              publisher: {
                '@type': 'Organization',
                '@id': 'https://www.emprendyup.com/#organization',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.emprendyup.com/buscar?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            },
            about: {
              '@type': 'Thing',
              name: 'Herramientas para Emprendimiento',
            },
            mentions: [
              {
                '@type': 'SoftwareApplication',
                name: 'Tienda Online',
                description: 'Plataforma para crear tiendas online profesionales',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Marketplace Colaborativo',
                description: 'Ecosystem de venta colaborativa entre emprendedores',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'CRM Integrado',
                description: 'Sistema de gestión de clientes para emprendedores',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'IA para Contenido',
                description: 'Inteligencia artificial para generar contenido de marketing',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Chatbot WhatsApp',
                description: 'Automatización de atención al cliente via WhatsApp',
              },
            ],
          }),
        }}
      />

      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: 'https://www.emprendyup.com/',
              },
            ],
          }),
        }}
      />

      {/* Service/Product structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Plataforma Emprendy.ai',
            description:
              'Herramientas integrales para emprendedores: tienda online + marketplace colaborativo + CRM + IA + chatbot WhatsApp + comunidad',
            brand: {
              '@type': 'Brand',
              name: 'Emprendy.ai',
            },
            category: 'Software de Emprendimiento',
            offers: {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              price: '0',
              priceCurrency: 'COP',
              priceValidUntil: '2025-12-31',
              url: 'https://www.emprendyup.com/registro',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '150',
              bestRating: '5',
              worstRating: '1',
            },
            review: [
              {
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '5',
                  bestRating: '5',
                },
                author: {
                  '@type': 'Person',
                  name: 'María González',
                },
                reviewBody:
                  'Emprendy.ai me ayudó a crear mi tienda online en minutos y conectarme con una comunidad increíble de emprendedores.',
              },
            ],
          }),
        }}
      />

      {/* LocalBusiness structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': 'https://www.emprendyup.com/#business',
            name: 'Emprendy.ai',
            description:
              'Plataforma integral para emprendedores con herramientas de tecnología, marketplace colaborativo y comunidad de apoyo',
            url: 'https://www.emprendyup.com',
            telephone: '+57-xxx-xxx-xxxx',
            email: 'contacto@emprendyup.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Bogotá',
              addressLocality: 'Bogotá',
              addressRegion: 'Cundinamarca',
              postalCode: '110111',
              addressCountry: 'CO',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 4.570868,
              longitude: -74.297333,
            },
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '08:00',
              closes: '18:00',
            },
            sameAs: [
              'https://www.facebook.com/emprendyup',
              'https://www.instagram.com/emprendyup',
              'https://www.linkedin.com/company/emprendyup',
              'https://twitter.com/emprendyup',
            ],
            priceRange: 'Gratis - $$$',
            paymentAccepted: 'Credit Card, PayPal, Bank Transfer',
            currenciesAccepted: 'COP, USD',
          }),
        }}
      />
    </Head>
  );
};

export default SEOHomepage;
