import React from 'react';
import { ShieldCheck, Zap, Headphones, Lock } from 'lucide-react';

interface FooterProps {
  siteName: string;
  siteLogo: string;
  contactEmail: string;
  telegramChannel: string;
}

export const Footer: React.FC<FooterProps> = ({
  siteName,
  siteLogo,
  contactEmail,
  telegramChannel,
}) => {
  return (
    <footer className="border-t border-zinc-900 bg-black mt-12 transition-colors">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-zinc-900/80 py-4 sm:py-5">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white">Instant Delivery</p>
                <p className="text-[10px] text-zinc-400">Immediate access</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white">100% Replacement</p>
                <p className="text-[10px] text-zinc-400">Guaranteed validity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white">Secure Payments</p>
                <p className="text-[10px] text-zinc-400">bKash / Nagad / Rocket</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white">24/7 Desk Support</p>
                <p className="text-[10px] text-zinc-400">{contactEmail || 'support@digivault.io'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{siteLogo}</span>
            <span className="font-['Syne',sans-serif] text-xs sm:text-sm font-bold text-white">
              {siteName}
            </span>
            <span className="text-[11px] text-zinc-500">· Digital Store & Telegram WebApp</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <a
              href={telegramChannel || 'https://t.me'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition-colors"
            >
              Telegram
            </a>
            <span aria-hidden="true">·</span>
            <span>Terms</span>
            <span aria-hidden="true">·</span>
            <span>Privacy</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${contactEmail}`}
              className="hover:text-indigo-400 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-900 text-center text-[10px] text-zinc-600">
          <p>© {new Date().getFullYear()} {siteName}. All digital rights protected.</p>
        </div>
      </div>
    </footer>
  );
};
