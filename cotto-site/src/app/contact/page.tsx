import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — COTTO",
};

export default function ContactPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-brand-red font-display">Contact</h1>
      <p className="mt-2 text-brand-red/70 max-w-prose">
        Have a question, a new flavor suggestion, or just want to say hi? Drop us a note.
      </p>

      <div className="mt-6 max-w-lg">
        <div className="klaviyo-form-Wmbj8y"></div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <a
          href="https://www.instagram.com/getcotto"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue underline underline-offset-4"
          data-analytics="outbound_social"
        >
          Instagram
        </a>
        <a
          href="https://www.tiktok.com/@getcotto"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue underline underline-offset-4"
          data-analytics="outbound_social"
        >
          TikTok
        </a>
      </div>
    </div>
  );
}


