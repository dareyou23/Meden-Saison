import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meden-Saison – Spielerverfügbarkeit',
  description: 'Spieltag-Verfügbarkeit für die Medensaison',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-100 min-h-screen">
        <header className="bg-green-700 text-white px-4 py-3 shadow">
          <h1 className="text-lg font-bold">🎾 Meden-Saison Köln-Leverkusen Sommer 2026</h1>
          <p className="text-sm text-green-200">TC Bayer Dormagen 4 – Herren 50</p>
        </header>
        <main className="max-w-2xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
