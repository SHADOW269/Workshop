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

type ShippingUpdateEmailProps = {
  orderNumber: string;
  status: string;
  trackingUrl?: string;
};

export default function ShippingUpdateEmail({
  orderNumber,
  status,
  trackingUrl,
}: ShippingUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Order {orderNumber} — {status}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.logo}>NAVRIX</Heading>
          <Heading style={styles.heading}>Order Update</Heading>
          <Text style={styles.text}>
            Your order <strong>{orderNumber}</strong> has been updated.
          </Text>

          <div style={styles.statusBox}>
            <Text style={styles.label}>Current Status</Text>
            <Text style={styles.status}>{status}</Text>
          </div>

          {trackingUrl && (
            <Button href={trackingUrl} style={styles.button}>
              Track Your Order
            </Button>
          )}

          <Button
            href="https://navrixtech.in/dashboard/orders"
            style={styles.secondaryButton}
          >
            View Order Details
          </Button>

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            Questions about your order?{" "}
            <Link href="https://navrixtech.in/contact" style={styles.link}>
              Contact us
            </Link>
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
    marginBottom: 24,
    color: "#4b5563",
  },
  statusBox: {
    backgroundColor: "#f3f4f6",
    padding: "16px 20px",
    borderRadius: 8,
    marginBottom: 24,
    textAlign: "center" as const,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  status: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    textTransform: "capitalize" as const,
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
    marginBottom: 12,
  },
  secondaryButton: {
    display: "block",
    width: "100%",
    backgroundColor: "#ffffff",
    color: "#111827",
    padding: "14px 24px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center" as const,
    textDecoration: "none",
    border: "1px solid #d1d5db",
  },
  hr: {
    borderTop: "1px solid #e5e7eb",
    margin: "32px 0",
  },
  footer: {
    fontSize: 14,
    textAlign: "center" as const,
    color: "#6b7280",
  },
  link: {
    color: "#111827",
    textDecoration: "underline",
  },
};
