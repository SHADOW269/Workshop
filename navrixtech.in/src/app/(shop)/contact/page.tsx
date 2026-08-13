import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Navrix. We'd love to hear from you — questions, feedback, or support requests.",
};

const businessInfo = {
  email: "support@navrixtech.in",
  phone: "+91 98765 43210",
  address: "Navrix Technologies, 42 Electronic Market, Nehru Place, New Delhi 110019",
  hours: "Mon - Sat: 10:00 AM - 7:00 PM IST",
};

const faqs = [
  {
    question: "What are your shipping times?",
    answer:
      "We ship within 1-2 business days. Standard delivery takes 5-7 business days across India. Express shipping (2-3 days) is available at checkout.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 7-day return policy for unused items in original packaging. Contact us to initiate a return and we'll arrange a pickup.",
  },
  {
    question: "Do you offer warranties?",
    answer:
      "All products come with manufacturer warranty. Extended warranty options are available for select products at checkout.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once shipped, you'll receive an email with tracking details. You can also track orders from your account dashboard.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Get in Touch</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Have a question or feedback? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Business Info</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{businessInfo.address}</p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${businessInfo.email}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {businessInfo.email}
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href={`tel:${businessInfo.phone.replace(/\s/g, "")}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {businessInfo.phone}
                </a>
              </p>
              <p>Hours: {businessInfo.hours}</p>
            </div>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Google Maps
            </div>
          </div>

          <div className="flex gap-4">
            {["Twitter", "Instagram", "YouTube"].map((platform) => (
              <span
                key={platform}
                className="rounded-full border px-4 py-2 text-xs font-medium"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="faq" className="mt-20">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-center">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl divide-y border-y">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between text-left font-medium">
                {faq.question}
                <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
