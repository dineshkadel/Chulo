import type { Route } from '../../App'
import { Soup } from 'lucide-react'

export function Footer({ navigate }: { navigate: (to: Route) => void }) {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[var(--ink)] text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="lg:col-span-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 mb-4"
          >
            <Soup size={24} aria-hidden="true" />
            <span className="font-black text-2xl tracking-tight text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Chulo<span className="text-[var(--gold)]">.</span>
            </span>
          </button>
          <p className="text-sm leading-relaxed text-white/60 max-w-[220px] mb-6">
            Kathmandu's table, delivered. Fresh food from the kitchens you love.
          </p>
          {/* Social icons */}
          <div className="flex gap-3">
            {/* Facebook */}
            <a
              href="#"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors text-white/60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            {/* Twitter/X */}
            <a
              href="#"
              aria-label="Twitter"
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors text-white/60"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors text-white/60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm tracking-widest uppercase text-[var(--gold)] mb-5">Quick Links</h4>
          <ul className="space-y-3 p-0 m-0 list-none text-sm text-white/70">
            {['Explore', 'Restaurants', 'About Us', 'Contact'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase().replace(' ', '')}`} className="hover:text-white transition-colors no-underline">
                  {item}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={() => navigate('/register')}
                className="bg-transparent border-0 p-0 text-sm text-white/70 hover:text-white cursor-pointer"
              >
                Sign Up
              </button>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-sm tracking-widest uppercase text-[var(--gold)] mb-5">Support</h4>
          <ul className="space-y-3 p-0 m-0 list-none text-sm text-white/70">
            {['Help Centre', 'FAQs', 'Order Issues', 'Partner With Us', 'Privacy Policy'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-white transition-colors no-underline">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-bold text-sm tracking-widest uppercase text-[var(--gold)] mb-5">Contact Us</h4>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-start gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--gold)] shrink-0 mt-0.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>Thamel, Kathmandu, Nepal</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--gold)] shrink-0">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.75 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>+977 1 4256789</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--gold)] shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>namaste@chulo.com.np</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 max-w-7xl mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <p className="m-0">© {year} Chulo. All rights reserved. Proudly made in Kathmandu.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors no-underline">Privacy</a>
          <a href="#" className="hover:text-white transition-colors no-underline">Terms</a>
          <a href="#" className="hover:text-white transition-colors no-underline">Cookies</a>
        </div>
      </div>
    </footer>
  )
}
