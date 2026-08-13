import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from "@react-email/components";

type WelcomeEmailProps = {
  name: string;
};

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Navrix — let&apos;s get you set up</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.logo}>NAVRIX</Heading>
          <Heading style={styles.heading}>Welcome, {name}!</Heading>
          <Text style={styles.text}>
            Thanks for creating an account. We&apos;re thrilled to have you.
            Browse our latest collections and find something you love.
          </Text>
          <Button href="https://navrixtech.in/products" style={styles.button}>
            Shop Now
          </Button>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            If you have any questions, reply to this email or visit our{" "}
            <Link href="https://navrixtech.in/contact" style={styles.link}>
              contact page
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#f9fafb",
    color: "#111827",
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "40px 20px",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textAlign: "center" as const,
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: "26px",
    textAlign: "center" as const,
    marginBottom: 32,
    color: "#4b5563",
  },
  button: {
    display: "block",
    width: "100%",
    backgroundColor: "#111827",
    color: "#ffffff",
    padding: "14px 24px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center" as const,
    textDecoration: "none",
  },
  hr: {
    borderTop: "1px solid #e5e7eb",
    margin: "32px 0",
  },
  footer: {
    fontSize: 14,
    lineHeight: "22px",
    textAlign: "center" as const,
    color: "#6b7280",
  },
  link: {
    color: "#111827",
    textDecoration: "underline",
  },
};
