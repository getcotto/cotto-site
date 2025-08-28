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
    <header 
      className="sticky top-0 z-50 header-stripes-bg"
      style={{
        background: 'repeating-linear-gradient(to right, #6F89C9, #6F89C9 100px, #7C1D1D 100px, #7C1D1D 200px)',
        color: 'white'
      }}
    >
      <div className="container flex items-center justify-between h-14">
        <Link 
          href="/" 
          className="text-xl font-semibold text-white" 
          aria-label="COTTO home"
          style={{ color: 'white' }}
        >
          <span style={{ fontFamily: "var(--font-logo)", color: 'white' }}>COTTO</span>
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm hover:underline underline-offset-4 text-white ${
                pathname === item.href ? "font-semibold" : "opacity-90"
              }`}
              style={{ color: 'white' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}




