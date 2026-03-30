'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { AboutSectionSettings } from './AboutSection.settings';
import { ABOUT_SECTION_DEFAULTS, type AboutSectionProps } from './AboutSection.props';

/* ── Static placeholder data ── */
const MILESTONES = [
  { year: '2020', desc: 'Fundación de la empresa y primeros pasos en el mercado local.' },
  { year: '2021', desc: 'Lanzamiento del primer producto y primeras 100 ventas exitosas.' },
  { year: '2022', desc: 'Expansión a nuevos mercados y alianzas estratégicas clave.' },
  { year: '2023', desc: 'Reconocimiento como empresa del año en la industria.' },
];

const TEAM_MEMBERS = [
  { initials: 'MG', name: 'María González', role: 'CEO & Fundadora' },
  { initials: 'JR', name: 'Juan Rodríguez', role: 'Director de Tecnología' },
  { initials: 'LP', name: 'Laura Pérez', role: 'Directora de Marketing' },
];

/* ── Main component ── */
export const AboutSection: UserComponent<AboutSectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  /* ── timeline variant ── */
  if (props.variant === 'timeline') {
    return (
      <section
        ref={(ref) => {
          if (ref) connect(drag(ref));
        }}
        data-block-type="AboutSection"
        className="w-full cursor-move py-16 px-6"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl font-bold mb-12"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {props.title}
          </h2>

          <div className="relative">
            {/* Vertical spine */}
            <div
              className="absolute left-16 top-0 bottom-0 w-0.5"
              style={{ borderLeft: '2px solid var(--color-primary)' }}
            />

            <div className="flex flex-col gap-10">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-8 items-start relative">
                  {/* Year label */}
                  <div
                    className="w-16 shrink-0 text-right text-sm font-bold pt-0.5"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {m.year}
                  </div>

                  {/* Dot */}
                  <div
                    className="relative z-10 w-3 h-3 rounded-full mt-1 shrink-0 -ml-1.5"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                    }}
                  />

                  {/* Description */}
                  <p
                    className="leading-relaxed flex-1"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── team variant ── */
  if (props.variant === 'team') {
    return (
      <section
        ref={(ref) => {
          if (ref) connect(drag(ref));
        }}
        data-block-type="AboutSection"
        className="w-full cursor-move py-16 px-6"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
            >
              {props.title}
            </h2>
            {props.description && (
              <p
                className="mt-4 max-w-xl mx-auto"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {props.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                {/* Avatar circle */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold select-none"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {member.initials}
                </div>
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
                  >
                    {member.name}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── default / side-by-side / centered / with-stats ── */
  const isCentered = props.variant === 'centered';
  const hasStats = props.variant === 'with-stats';

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="AboutSection"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className={`max-w-5xl mx-auto ${isCentered ? 'text-center' : 'flex gap-12 items-center'}`}
      >
        {!isCentered && props.image && (
          <div className="w-80 shrink-0">
            <img
              src={props.image}
              alt={props.title}
              className="rounded-xl w-full aspect-square object-cover"
            />
          </div>
        )}
        {!isCentered && !props.image && (
          <div className="w-80 shrink-0 bg-gray-200 rounded-xl aspect-square flex items-center justify-center text-gray-400 text-sm">
            Sin imagen
          </div>
        )}

        <div>
          <h2
            className="text-3xl font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {props.title}
          </h2>
          <p
            className="mt-4 leading-relaxed"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {props.description}
          </p>

          {hasStats && (
            <div className="mt-8 grid grid-cols-3 gap-6">
              {props.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {s.value}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

AboutSection.craft = {
  displayName: 'Sobre Nosotros',
  props: { ...ABOUT_SECTION_DEFAULTS, variant: 'default' },
  related: { settings: AboutSectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
