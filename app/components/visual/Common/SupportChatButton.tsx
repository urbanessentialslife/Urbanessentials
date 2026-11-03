import {useState} from 'react';
import {Link} from 'react-router';

interface SupportChatButtonProps {
  supportEmail?: string | null;
  whatsappNumber?: string | null;
}

/**
 * Floating sitewide help entry point. No live-chat vendor is wired up, so
 * this opens a small popover of real, working contact options instead of a
 * chat widget that would otherwise sit there doing nothing — email and
 * WhatsApp options only render when their env var is actually configured
 * (see env.d.ts), same no-op-until-configured pattern as the newsletter's
 * Admin API token.
 */
export function SupportChatButton({supportEmail, whatsappNumber}: SupportChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!supportEmail && !whatsappNumber) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 font-sans">
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-64 bg-white border border-[#c9c2b8] rounded-2xl shadow-xl p-4 space-y-2 animate-fade-in">
          <p className="text-xs uppercase tracking-widest text-[#6d6560] font-semibold mb-2">
            Need a hand?
          </p>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#f4f0e8] text-sm text-[#241a16] transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.1h-.01a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.12.82.84-3.04-.2-.31a8.22 8.22 0 01-1.26-4.37c0-4.54 3.69-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 012.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          )}
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#f4f0e8] text-sm text-[#241a16] transition-colors"
            >
              <svg className="w-4 h-4 text-[#6d6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email Us</span>
            </a>
          )}
          <Link
            to="/faq"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#f4f0e8] text-sm text-[#241a16] transition-colors"
          >
            <svg className="w-4 h-4 text-[#6d6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Browse FAQ</span>
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close help menu' : 'Open help menu'}
        aria-expanded={isOpen}
        className="w-12 h-12 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#dfc08a] shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
