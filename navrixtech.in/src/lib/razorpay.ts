import Razorpay from "razorpay";

let razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpay;
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  const order = await getRazorpay().orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
  });

  return order;
}

export default getRazorpay;
