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
const STATUS_BG: Record<string, string> = { ja: 'bg-green-100', nein: 'bg-red-100', unsicher: 'bg-yellow-100', '': '' };

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

  if (!loaded) return <div className="text-center py-12 text-gray-500">Laden...</div>;

  if (!authorized) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Admin-Bereich nur für Mannschaftsführer.</p>
        <p className="text-sm text-gray-400 mb-4">Bitte zuerst als Markus Wages einloggen.</p>
        <Link href="/" className="text-blue-600 hover:underline">← Zurück zur Startseite</Link>
      </div>
    );
  }

  const getStatus = (spieltagId: string, spielerId: string): Verfuegbarkeit => {
    return (data[spieltagId]?.[spielerId] || '') as Verfuegbarkeit;
  };

  const alleSpieler = [...spieler].sort((a, b) => a.pos - b.pos);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Admin-Übersicht</h2>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Spieler-Ansicht</Link>
      </div>

      {/* Zusammenfassung pro Spieltag */}
      <div className="space-y-2 mb-6">
        {spieltage.map(st => {
          const zusagen = alleSpieler.filter(s => getStatus(st.id, s.id) === 'ja');
          const unsichere = alleSpieler.filter(s => getStatus(st.id, s.id) === 'unsicher');
          const absagen = alleSpieler.filter(s => getStatus(st.id, s.id) === 'nein');
          const offen = alleSpieler.filter(s => getStatus(st.id, s.id) === '');
          const zuWenig = zusagen.length < 6;
          const genug = zusagen.length >= 6;
          const gegner = st.heim ? st.gastmannschaft : st.heimmannschaft;
          const cardClass = zuWenig ? 'bg-red-50 border-red-200' : genug ? 'bg-green-50 border-green-200' : 'bg-white';

          return (
            <div key={st.id} className={`rounded-lg border p-3 ${cardClass}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">
                  {formatDatum(st.datum)} {st.uhrzeit} · {st.heim ? '🏠' : '🚗'} vs {gegner}
                </span>
                <span className={`text-sm font-bold ${zuWenig ? 'text-red-600' : 'text-green-600'}`}>
                  {zusagen.length}/6
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                {zusagen.length > 0 && <p>✅ <span className="text-green-700">{zusagen.map(s => s.name).join(', ')}</span></p>}
                {unsichere.length > 0 && <p>❓ <span className="text-yellow-700">{unsichere.map(s => s.name).join(', ')}</span></p>}
                {absagen.length > 0 && <p>❌ <span className="text-red-700">{absagen.map(s => s.name).join(', ')}</span></p>}
                {offen.length > 0 && <p>— <span className="text-gray-400">{offen.map(s => s.name).join(', ')}</span></p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix-Tabelle */}
      <h3 className="font-bold text-gray-700 mb-2">Gesamtübersicht</h3>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 text-left sticky left-0 bg-gray-100 z-10 min-w-[140px]">Spieler</th>
              <th className="border border-gray-300 px-1 py-1 text-left w-12">LK</th>
              <th className="border border-gray-300 px-1 py-1 text-center w-8">K</th>
              {spieltage.map(st => (
                <th key={st.id} className="border border-gray-300 px-1 py-1 text-center min-w-[50px]">
                  <div>{formatKurz(st.datum)}</div>
                  <div className="text-[10px] text-gray-400">{st.heim ? 'H' : 'A'}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alleSpieler.map(s => (
              <tr key={s.id} className={s.kern ? '' : 'text-gray-400'}>
                <td className="border border-gray-300 px-2 py-1 sticky left-0 bg-white z-10 whitespace-nowrap">{s.name}</td>
                <td className="border border-gray-300 px-1 py-1 text-center">{s.lk}</td>
                <td className="border border-gray-300 px-1 py-1 text-center">{s.kern ? '✓' : ''}</td>
                {spieltage.map(st => {
                  const status = getStatus(st.id, s.id);
                  return (
                    <td key={st.id} className={`border border-gray-300 px-1 py-1 text-center ${STATUS_BG[status]}`}>
                      {STATUS_ICON[status]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-300 px-2 py-1 sticky left-0 bg-gray-50 z-10" colSpan={3}>Zusagen</td>
              {spieltage.map(st => {
                const count = alleSpieler.filter(s => getStatus(st.id, s.id) === 'ja').length;
                return (
                  <td key={st.id} className={`border border-gray-300 px-1 py-1 text-center ${count < 6 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {count}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
