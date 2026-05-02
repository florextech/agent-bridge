import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';

interface InvitationEmailProps {
  acceptUrl: string;
}

export default function InvitationEmail({ acceptUrl = 'https://example.com/accept-invite?token=xxx' }: Readonly<InvitationEmailProps>) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#111513', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '32px' }}>
          <Section style={{ backgroundColor: '#1a1f1c', borderRadius: '12px', padding: '32px', border: '1px solid #2a2f2c' }}>
            <Text style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              You&apos;re invited to Agent Bridge
            </Text>
            <Text style={{ color: '#b8c4ba', lineHeight: '1.6', fontSize: '14px' }}>
              You&apos;ve been invited to join Agent Bridge. Click the button below to create your account.
            </Text>
            <Button href={acceptUrl} style={{ display: 'inline-block', margin: '24px 0', padding: '12px 24px', backgroundColor: '#76b73d', color: '#111513', fontWeight: 600, textDecoration: 'none', borderRadius: '8px', fontSize: '14px' }}>
              Accept Invitation
            </Button>
            <Hr style={{ borderTop: '1px solid #2a2f2c', margin: '24px 0' }} />
            <Text style={{ fontSize: '12px', color: '#6b7c6e' }}>
              This link expires in 7 days.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
