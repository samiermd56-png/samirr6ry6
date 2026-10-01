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
    <footer className="border-t border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/50 mt-16 transition-colors">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-100 dark:border-slate-800/60 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Instant Delivery</p>
                <p className="text-[11px] text-slate-500">Credentials unlock immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">100% Replacement</p>
                <p className="text-[11px] text-slate-500">Guaranteed full validity warranty</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Secure Payments</p>
                <p className="text-[11px] text-slate-500">bKash, Nagad & Rocket manual deposit</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">24/7 Desk Support</p>
                <p className="text-[11px] text-slate-500">{contactEmail || 'support@digivault.io'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">{siteLogo}</span>
            <span className="font-['Syne',sans-serif] text-sm font-bold text-slate-900 dark:text-white">
              {siteName}
            </span>
            <span className="text-xs text-slate-400">· Digital Goods & Service Vault</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <a
              href={telegramChannel || 'https://t.me'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Telegram Community
            </a>
            <span aria-hidden="true">·</span>
            <span>Terms of Service</span>
            <span aria-hidden="true">·</span>
            <span>Privacy Policy</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${contactEmail}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} {siteName}. All digital rights and licenses protected.</p>
        </div>
      </div>
    </footer>
  );
};
