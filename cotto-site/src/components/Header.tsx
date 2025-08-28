"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-black/5">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="text-xl font-semibold" aria-label="COTTO home">
          <span style={{ fontFamily: "var(--font-logo)" }}>COTTO</span>
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm hover:underline underline-offset-4 ${
                pathname === item.href ? "text-[color:var(--cotto-red)]" : "text-black/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}




