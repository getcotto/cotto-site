import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="container py-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-brand-ink/70">© {new Date().getFullYear()} COTTO</div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/getcotto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-ink/80 hover:text-brand-ink"
            data-analytics="outbound_social"
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@getcotto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-ink/80 hover:text-brand-ink"
            data-analytics="outbound_social"
          >
            TikTok
          </a>
          <Link href="/privacy" className="text-sm text-brand-ink/80 hover:text-brand-ink">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-brand-ink/80 hover:text-brand-ink">
            Terms
          </Link>
        </div>
        <p className="mt-2 text-xs text-brand-ink/60 text-center sm:text-left">
          By joining the waitlist, you agree to receive occasional emails from COTTO. We respect your privacy and will never share your email.
        </p>
      </div>
    </footer>
  );
}


