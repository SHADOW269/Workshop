import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Text,
  Button,
} from "@react-email/components";

type OrderItem = {
  productName: string;
  variantValue?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

type OrderConfirmationEmailProps = {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
};

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export default function OrderConfirmationEmail({
  orderNumber,
  items,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  const address = [
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} confirmed — Navrix</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.logo}>NAVRIX</Heading>
          <Heading style={styles.heading}>Order Confirmed!</Heading>
          <Text style={styles.text}>
            Thank you for your order. We&apos;ve received it and are processing it
            now.
          </Text>

          <div style={styles.orderBox}>
            <Text style={styles.label}>Order Number</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </div>

          {items.map((item, i) => (
            <Row key={i} style={styles.itemRow}>
              {item.image && (
                <Column style={styles.imageCol}>
                  <Img
                    src={item.image}
                    width={64}
                    height={64}
                    style={styles.itemImage}
                  />
                </Column>
              )}
              <Column style={styles.detailsCol}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variantValue && (
                  <Text style={styles.itemVariant}>{item.variantValue}</Text>
                )}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={styles.priceCol}>
                <Text style={styles.itemPrice}>{formatPrice(item.total)}</Text>
              </Column>
            </Row>
          ))}

          <Hr style={styles.hr} />
          <Row>
            <Column>
              <Text style={styles.totalLabel}>Total</Text>
            </Column>
            <Column>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </Column>
          </Row>

          {address && (
            <>
              <Text style={styles.label}>Shipping Address</Text>
              <Text style={styles.address}>{address}</Text>
            </>
          )}

          <Button
            href="https://navrixtech.in/dashboard/orders"
            style={styles.button}
          >
            View Order
          </Button>

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            We&apos;ll send you another email when your order ships.
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
  orderBox: {
    backgroundColor: "#f3f4f6",
    padding: "16px 20px",
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  itemRow: {
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  imageCol: { width: 80 },
  detailsCol: { paddingLeft: 8 },
  priceCol: { textAlign: "right" as const },
  itemImage: { borderRadius: 6 },
  itemName: { fontSize: 15, fontWeight: 600, margin: "0 0 2px" },
  itemVariant: { fontSize: 13, color: "#6b7280", margin: "0 0 2px" },
  itemQty: { fontSize: 13, color: "#6b7280", margin: 0 },
  itemPrice: { fontSize: 15, fontWeight: 600, margin: 0 },
  hr: {
    borderTop: "1px solid #e5e7eb",
    margin: "20px 0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    textAlign: "right" as const,
  },
  address: {
    fontSize: 15,
    lineHeight: "24px",
    color: "#374151",
    margin: "4px 0 20px",
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
    marginTop: 24,
  },
  footer: {
    fontSize: 14,
    textAlign: "center" as const,
    color: "#6b7280",
  },
};
