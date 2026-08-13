import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_missing");

// No-op sender used when RESEND_API_KEY is not configured (dev/local)
async function send(mail: Parameters<Resend["emails"]["send"]>[0]) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] skipping send to ${mail.to}: no RESEND_API_KEY`);
    return;
  }
  await resend.emails.send(mail);
}

const FROM_ADDRESS = `${SITE_NAME} <noreply@navrixtech.in>`;

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to ${SITE_NAME}, ${name}!</h1>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for creating an account. We're excited to have you on board.
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Browse our latest collections and find something you love.
      </p>
      <a href="${SITE_URL}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Shop Now</a>
      <p style="font-size: 14px; color: #666; margin-top: 32px;">
        If you have any questions, feel free to reach out to our support team.
      </p>
    </body>
    </html>
  `;

  await send({
    from: FROM_ADDRESS,
    to,
    subject: `Welcome to ${SITE_NAME}!`,
    html,
  });
}

export async function sendOrderConfirmation(
  to: string,
  orderNumber: string,
  total: number
) {
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(total / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Order Confirmed!</h1>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for your order. We've received your order and are processing it now.
      </p>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
        <p style="margin: 4px 0 12px; font-size: 18px; font-weight: 600;">${orderNumber}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Total</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600;">${formattedTotal}</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        We'll send you another email when your order ships.
      </p>
      <a href="${SITE_URL}/orders" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Order</a>
    </body>
    </html>
  `;

  await send({
    from: FROM_ADDRESS,
    to,
    subject: `Order ${orderNumber} Confirmed - ${SITE_NAME}`,
    html,
  });
}

export async function sendPasswordReset(to: string, token: string) {
  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Reset Your Password</h1>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        We received a request to reset your password. Click the button below to set a new one.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
      <p style="font-size: 14px; color: #666; margin-top: 32px;">
        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </body>
    </html>
  `;

  await send({
    from: FROM_ADDRESS,
    to,
    subject: `Reset Your Password - ${SITE_NAME}`,
    html,
  });
}

export async function sendShippingUpdate(
  to: string,
  orderNumber: string,
  status: string,
  trackingUrl?: string
) {
  const trackingSection = trackingUrl
    ? `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Track Your Order</a>
       </p>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Order Update</h1>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Your order <strong>${orderNumber}</strong> has been updated.
      </p>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #666;">Current Status</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; text-transform: capitalize;">${status.toLowerCase()}</p>
      </div>
      ${trackingSection}
      <a href="${SITE_URL}/orders" style="display: inline-block; background-color: transparent; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; border: 1px solid #000; font-weight: 500;">View Order Details</a>
    </body>
    </html>
  `;

  await send({
    from: FROM_ADDRESS,
    to,
    subject: `Order ${orderNumber} - ${status} - ${SITE_NAME}`,
    html,
  });
}
