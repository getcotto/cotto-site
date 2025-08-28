import ContactForm from "./ContactForm";
export const metadata = {
  title: "Contact — COTTO",
};

export default function ContactPage() {
  return (
    <div className="container py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-2 text-black/70 max-w-prose">
        Have a question or want to say hi? Drop us a note.
      </p>

      <div className="mt-8 max-w-lg">
        <ContactForm />
      </div>

      <div className="mt-10 flex items-center gap-4">
        <a
          href="https://www.instagram.com/getcotto"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[color:var(--cotto-blue)] underline underline-offset-4"
          data-analytics="outbound_social"
        >
          Instagram
        </a>
        <a
          href="https://www.tiktok.com/@getcotto"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[color:var(--cotto-blue)] underline underline-offset-4"
          data-analytics="outbound_social"
        >
          TikTok
        </a>
      </div>
    </div>
  );
}


