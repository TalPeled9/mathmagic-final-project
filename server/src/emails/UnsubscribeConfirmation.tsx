import * as React from 'react';
import { Body, Container, Head, Heading, Html, Img, Section, Text } from '@react-email/components';
import { COLORS, FONT_FAMILY } from './theme';

export interface UnsubscribeConfirmationProps {
  logoUrl: string;
}

export function UnsubscribeConfirmation({ logoUrl }: UnsubscribeConfirmationProps) {
  return (
    <Html>
      <Head>
        <title>Unsubscribed — MathMagic</title>
      </Head>
      <Body style={{ backgroundColor: COLORS.parchment, fontFamily: FONT_FAMILY, margin: 0, padding: '48px 0' }}>
        <Container style={{ maxWidth: '420px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <Img src={logoUrl} alt="MathMagic" width="160" style={{ margin: '0 auto 24px' }} />
          <Section
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '16px',
              padding: '32px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <Text style={{ fontSize: '32px', margin: '0 0 8px' }}>👋</Text>
            <Heading as="h1" style={{ fontSize: '18px', color: COLORS.gray900, margin: '0 0 8px' }}>
              You're unsubscribed
            </Heading>
            <Text style={{ fontSize: '13px', color: COLORS.gray400, margin: 0 }}>
              You won't receive weekly progress report emails anymore. You can re-enable them any
              time from your account settings in the app.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default UnsubscribeConfirmation;
