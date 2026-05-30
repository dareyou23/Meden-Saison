import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meden-Saison – Spielerverfügbarkeit',
  description: 'Spieltag-Verfügbarkeit für die Medensaison',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen theme-body">
        <header className="theme-header border-b px-4 py-4 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-cyan rounded-xl flex items-center justify-center text-lg shadow-btn">
                🎾
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight theme-title">Meden Köln-Leverkusen</h1>
                <p className="text-xs theme-subtitle">TC Bayer Dormagen 4 · Herren 50 · Sommer 2026</p>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
