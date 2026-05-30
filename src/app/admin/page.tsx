'use client';

import { useState, useEffect } from 'react';
import { api, Spieltag, Spieler, Verfuegbarkeit } from '@/lib/api';
import Link from 'next/link';

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function formatKurz(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;
}

function formatDatum(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${WOCHENTAGE[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

type AllVerfuegbarkeiten = Record<string, Record<string, Verfuegbarkeit>>;

const STATUS_ICON: Record<string, string> = { ja: '✅', nein: '❌', unsicher: '❓', '': '—' };
const STATUS_BG: Record<string, string> = { ja: 'bg-accent-green/10', nein: 'bg-accent-red/10', unsicher: 'bg-accent-yellow/10', '': '' };

export default function AdminPage() {
  const [spieltage, setSpieltage] = useState<Spieltag[]>([]);
  const [spieler, setSpieler] = useState<Spieler[]>([]);
  const [data, setData] = useState<AllVerfuegbarkeiten>({});
  const [loaded, setLoaded] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const savedId = localStorage.getItem('meden_current_player_id');
      setAuthorized(savedId === 's61');

      const [stRes, spRes, vRes] = await Promise.all([
        api.listSpieltage(),
        api.listSpieler(),
        api.getAllVerfuegbarkeit(),
      ]);
      if (stRes.success && stRes.data) setSpieltage(stRes.data);
      if (spRes.success && spRes.data) setSpieler(spRes.data);
      if (vRes.success && vRes.data) setData(vRes.data as AllVerfuegbarkeiten);
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authorized) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-dove-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
        <p className="text-dove-300 mb-2">Nur für Mannschaftsführer.</p>
        <Link href="/" className="text-accent-cyan font-bold hover:text-white transition-colors">← Zurück</Link>
      </div>
    );
  }

  const getStatus = (spieltagId: string, spielerId: string): Verfuegbarkeit => {
    return (data[spieltagId]?.[spielerId] || '') as Verfuegbarkeit;
  };

  const alleSpieler = [...spieler].sort((a, b) => a.pos - b.pos);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Admin-Übersicht</h2>
        <Link href="/" className="text-sm font-bold text-accent-cyan hover:text-white px-3 py-2 rounded-xl hover:bg-dove-700 transition-all">
          ← Spieler-Ansicht
        </Link>
      </div>

      {/* Zusammenfassung pro Spieltag */}
      <div className="space-y-3">
        {spieltage.map(st => {
          const zusagen = alleSpieler.filter(s => getStatus(st.id, s.id) === 'ja');
          const unsichere = alleSpieler.filter(s => getStatus(st.id, s.id) === 'unsicher');
          const absagen = alleSpieler.filter(s => getStatus(st.id, s.id) === 'nein');
          const offen = alleSpieler.filter(s => getStatus(st.id, s.id) === '');
          const zuWenig = zusagen.length < 6;
          const gegner = st.heim ? st.gastmannschaft : st.heimmannschaft;

          return (
            <div key={st.id} className="card p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-white">
                  {formatDatum(st.datum)} {st.uhrzeit} · {st.heim ? '🏠' : '🚗'} vs {gegner}
                </span>
                <span className={`badge ${zuWenig ? 'bg-red-500/20 text-red-300' : 'bg-accent-green/20 text-green-300'}`}>
                  {zusagen.length}/6
                </span>
              </div>
              <div className="text-xs space-y-1">
                {zusagen.length > 0 && <p>✅ <span className="text-green-300 font-medium">{zusagen.map(s => s.name).join(', ')}</span></p>}
                {unsichere.length > 0 && <p>❓ <span className="text-yellow-300 font-medium">{unsichere.map(s => s.name).join(', ')}</span></p>}
                {absagen.length > 0 && <p>❌ <span className="text-red-300 font-medium">{absagen.map(s => s.name).join(', ')}</span></p>}
                {offen.length > 0 && <p className="text-dove-400">— {offen.map(s => s.name).join(', ')}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix-Tabelle */}
      <div>
        <h3 className="font-bold text-white mb-3">Gesamtübersicht</h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-dove-700">
                  <th className="px-3 py-2.5 text-left sticky left-0 bg-dove-700 z-10 min-w-[130px] font-bold text-dove-200">Spieler</th>
                  <th className="px-2 py-2.5 text-center w-10 font-bold text-dove-200">LK</th>
                  <th className="px-2 py-2.5 text-center w-8 font-bold text-dove-200">K</th>
                  {spieltage.map(st => (
                    <th key={st.id} className="px-2 py-2.5 text-center min-w-[48px] font-bold text-dove-200">
                      <div>{formatKurz(st.datum)}</div>
                      <div className="text-[10px] text-dove-400 font-normal">{st.heim ? 'H' : 'A'}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dove-200/20">
                {alleSpieler.map(s => (
                  <tr key={s.id} className={`${s.kern ? '' : 'opacity-50'} hover:bg-dove-600/50 transition-colors`}>
                    <td className="px-3 py-2 sticky left-0 bg-dove-100 z-10 whitespace-nowrap font-bold text-white">{s.name}</td>
                    <td className="px-2 py-2 text-center text-dove-300">{s.lk}</td>
                    <td className="px-2 py-2 text-center">{s.kern ? <span className="text-accent-cyan font-bold">✓</span> : ''}</td>
                    {spieltage.map(st => {
                      const status = getStatus(st.id, s.id);
                      return (
                        <td key={st.id} className={`px-2 py-2 text-center ${STATUS_BG[status]}`}>
                          {STATUS_ICON[status]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-dove-700 font-bold">
                  <td className="px-3 py-2.5 sticky left-0 bg-dove-700 z-10 text-dove-200" colSpan={3}>Zusagen</td>
                  {spieltage.map(st => {
                    const count = alleSpieler.filter(s => getStatus(st.id, s.id) === 'ja').length;
                    return (
                      <td key={st.id} className={`px-2 py-2.5 text-center font-bold ${count < 6 ? 'text-red-300' : 'text-green-300'}`}>
                        {count}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
