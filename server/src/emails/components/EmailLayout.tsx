import * as React from 'react';
import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import { COLORS, FONT_FAMILY } from '../theme';

interface Props {
  previewText: string;
  logoUrl: string;
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, logoUrl, unsubscribeUrl, children }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: COLORS.parchment, fontFamily: FONT_FAMILY, margin: 0, padding: '24px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px' }}>
          <Section style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <Img src={logoUrl} alt="MathMagic" width="180" style={{ margin: '0 auto' }} />
          </Section>

          <Section
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '16px',
              padding: '28px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {children}
          </Section>

          <Section style={{ textAlign: 'center', padding: '20px 8px 0' }}>
            <Text style={{ fontSize: '12px', color: COLORS.gray400, margin: '0 0 6px' }}>
              Wizzy makes math easy! ✨ — MathMagic
            </Text>
            {unsubscribeUrl && (
              <Text style={{ fontSize: '12px', color: COLORS.gray400, margin: 0 }}>
                <Link href={unsubscribeUrl} style={{ color: COLORS.gray400, textDecoration: 'underline' }}>
                  Unsubscribe from weekly reports
                </Link>
              </Text>
            )}
          </Section>
          <Hr style={{ borderColor: 'transparent', margin: '4px 0' }} />
        </Container>
      </Body>
    </Html>
  );
}
