import React from 'react';
import type { PartnerDoc, TestimonialDoc } from '../lib/data.ts';
import { Icon } from './Icon.tsx';

interface Props {
  partners: PartnerDoc[];
  testimonials: TestimonialDoc[];
  labels: {
    partnersTitle: string;
    testimonialsTitle: string;
    visitPartner: string;
  };
}

export function PartnersSection({ partners, testimonials, labels }: Props) {
  if (partners.length === 0 && testimonials.length === 0) return null;

  return (
    <div className="stack" style={{ '--stack': 'var(--space-10)', marginBlockStart: 'var(--space-8)' } as React.CSSProperties}>
      {partners.length > 0 ? (
        <section aria-labelledby="partners-heading" className="stack" style={{ '--stack': 'var(--space-4)' } as React.CSSProperties}>
          <h2 id="partners-heading" style={{ fontSize: 'var(--step-2)', textAlign: 'center' }}>
            {labels.partnersTitle}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'center',
            }}
          >
            {partners.map((partner) => {
              const logoSrc = partner.logoUrl || (typeof partner.logo === 'object' && partner.logo ? partner.logo.url : null);
              const content = (
                <div
                  className="card"
                  style={{
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    height: '100%',
                    justifyContent: 'center',
                  }}
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={partner.name}
                      style={{ maxHeight: '60px', maxWidth: '140px', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--step-0)' }}>{partner.name}</div>
                  )}
                  {partner.description ? (
                    <p style={{ margin: 0, fontSize: 'var(--step--2)', color: 'var(--text-2)' }}>
                      {partner.description}
                    </p>
                  ) : null}
                  {partner.website ? (
                    <span style={{ fontSize: 'var(--step--2)', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon name="link" /> {labels.visitPartner}
                    </span>
                  ) : null}
                </div>
              );

              return partner.website ? (
                <a
                  key={partner.id}
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {content}
                </a>
              ) : (
                <div key={partner.id}>{content}</div>
              );
            })}
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section aria-labelledby="testimonials-heading" className="stack" style={{ '--stack': 'var(--space-4)' } as React.CSSProperties}>
          <h2 id="testimonials-heading" style={{ fontSize: 'var(--step-2)', textAlign: 'center' }}>
            {labels.testimonialsTitle}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {testimonials.map((item) => (
              <blockquote
                key={item.id}
                className="box box--tint stack"
                style={{
                  '--stack': 'var(--space-3)',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                } as React.CSSProperties}
              >
                <p style={{ margin: 0, fontSize: 'var(--step-0)', fontStyle: 'italic', lineHeight: 1.8 }}>
                  «{item.quote}»
                </p>
                <footer style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 'var(--step-0)' }}>{item.personName}</strong>
                    {item.personTitle || item.institution ? (
                      <span style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)' }}>
                        {[item.personTitle, item.institution].filter(Boolean).join(' — ')}
                      </span>
                    ) : null}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
