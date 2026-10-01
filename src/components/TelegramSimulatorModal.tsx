import React, { useState } from 'react';
import { X, Send, Smartphone, Globe, ExternalLink, Sparkles, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  appUrl: string;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  siteName,
  appUrl,
}) => {
  const [inWebAppView, setInWebAppView] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `👋 Welcome to ${siteName} Store!\n\nBrowse products, manage your wallet, and purchase digital services instantly inside Telegram.\n\nTap below to open the web store:`,
      time: '12:00 PM',
      hasButton: true,
    }
  ]);

  if (!isOpen) return null;

  const handleStartCommand = () => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: `/start`,
        time: 'Just now',
        hasButton: false,
      },
      {
        id: Date.now() + 1,
        sender: 'bot',
        text: `👋 Welcome to <b>${siteName}</b>! Browse our verified digital goods, VPN keys, and software.\n\nTap below to launch the store inside Telegram:`,
        time: 'Just now',
        hasButton: true,
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[680px] max-h-[92vh]">
        
        {/* Telegram App Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#17212b] border-b border-[#242f3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-bold text-xs text-white">
              TB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">{siteName} Bot</span>
                <span className="text-[10px] text-sky-400 bg-sky-950/80 px-1 rounded">bot</span>
              </div>
              <p className="text-[10px] text-slate-400">Telegram WebApp Enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setInWebAppView(!inWebAppView)}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 text-sky-300 rounded hover:bg-slate-700 transition-colors"
            >
              {inWebAppView ? 'Chat View' : 'Launch WebApp'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area: Either Telegram Bot Chat or WebApp Embedded View */}
        {inWebAppView ? (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Telegram WebApp Top Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#212d3b] text-white text-xs border-b border-slate-800">
              <button
                onClick={() => setInWebAppView(false)}
                className="text-sky-400 font-medium hover:underline text-[11px]"
              >
                ← Close
              </button>
              <div className="flex items-center gap-1 font-semibold text-slate-200">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>{siteName} WebApp</span>
              </div>
              <span className="text-[10px] text-slate-400">···</span>
            </div>

            {/* Embedded Live Iframe of current app */}
            <div className="flex-1 w-full relative">
              <iframe
                src={appUrl || window.location.href}
                title="Telegram WebApp View"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between bg-[#0e1621] p-3 overflow-y-auto">
            {/* Chat Messages */}
            <div className="space-y-3">
              <div className="text-center my-2">
                <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#2b5278] text-white rounded-tr-xs'
                        : 'bg-[#182533] text-slate-200 rounded-tl-xs border border-[#242f3d]'
                    }`}
                  >
                    <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: msg.text }} />

                    {msg.hasButton && (
                      <div className="mt-3 pt-2.5 border-t border-[#242f3d] space-y-2">
                        <button
                          onClick={() => setInWebAppView(true)}
                          className="w-full py-2 px-3 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>🛍️ Open Web Store</span>
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 text-right mt-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Chat Bar with permanent Menu Button */}
            <div className="mt-4 pt-2 border-t border-[#242f3d]">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleStartCommand}
                  className="px-2.5 py-1 text-[10px] font-medium bg-[#17212b] text-sky-300 rounded border border-[#242f3d] hover:bg-[#202c3a] transition-colors"
                >
                  Send /start
                </button>
                <button
                  type="button"
                  onClick={() => setInWebAppView(true)}
                  className="px-2.5 py-1 text-[10px] font-medium bg-[#17212b] text-emerald-300 rounded border border-[#242f3d] hover:bg-[#202c3a] transition-colors"
                >
                  Launch WebApp
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[#17212b] p-1.5 rounded-xl border border-[#242f3d]">
                <button
                  onClick={() => setInWebAppView(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#242f3d] text-sky-400 rounded-lg hover:bg-[#2e3b4c]"
                  title="Permanent Telegram WebApp Menu Button"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Menu</span>
                </button>
                <input
                  type="text"
                  placeholder="Write a message..."
                  disabled
                  value="/start"
                  className="flex-1 bg-transparent text-xs text-slate-400 px-2 focus:outline-none"
                />
                <button
                  onClick={handleStartCommand}
                  className="p-1.5 text-sky-400 hover:text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
