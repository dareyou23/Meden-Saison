'use client';

import { useState, useEffect } from 'react';
import { api, Spieltag, Spieler, Verfuegbarkeit } from '@/lib/api';
import { downloadICS } from '@/lib/ics';

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function formatDatum(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${WOCHENTAGE[d.getDay()]}. ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

type AllVerfuegbarkeiten = Record<string, Record<string, Verfuegbarkeit>>;

export default function HomePage() {
  const [currentPlayer, setCurrentPlayer] = useState<Spieler | null>(null);
  const [spieltage, setSpieltage] = useState<Spieltag[]>([]);
  const [spieler, setSpieler] = useState<Spieler[]>([]);
  const [data, setData] = useState<AllVerfuegbarkeiten>({});
  const [loaded, setLoaded] = useState(false);
  const [showAlle, setShowAlle] = useState(false);

  useEffect(() => {
    async function load() {
      const [stRes, spRes, vRes] = await Promise.all([
        api.listSpieltage(),
        api.listSpieler(),
        api.getAllVerfuegbarkeit(),
      ]);
      if (stRes.success && stRes.data) setSpieltage(stRes.data);
      if (spRes.success && spRes.data) setSpieler(spRes.data);
      if (vRes.success && vRes.data) setData(vRes.data as AllVerfuegbarkeiten);

      const savedId = localStorage.getItem('meden_current_player_id');
      if (savedId && spRes.data) {
        const found = spRes.data.find(s => s.id === savedId);
        if (found) setCurrentPlayer(found);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const selectPlayer = (s: Spieler) => {
    setCurrentPlayer(s);
    localStorage.setItem('meden_current_player_id', s.id);
  };

  const setVerfuegbarkeitHandler = async (spieltagId: string, status: Verfuegbarkeit) => {
    if (!currentPlayer) return;
    // Optimistic update
    const next = { ...data };
    if (!next[spieltagId]) next[spieltagId] = {};
    next[spieltagId][currentPlayer.id] = status;
    setData(next);
    // API call
    await api.setVerfuegbarkeit(spieltagId, currentPlayer.id, status);
  };

  const getStatus = (spieltagId: string, spielerId: string): Verfuegbarkeit => {
    return (data[spieltagId]?.[spielerId] || '') as Verfuegbarkeit;
  };

  const getZusagen = (spieltagId: string): Spieler[] => {
    return spieler.filter(s => getStatus(spieltagId, s.id) === 'ja').sort((a, b) => a.pos - b.pos);
  };

  const getUnsichere = (spieltagId: string): Spieler[] => {
    return spieler.filter(s => getStatus(spieltagId, s.id) === 'unsicher').sort((a, b) => a.pos - b.pos);
  };

  if (!loaded) return <div className="text-center py-12 text-gray-500">Laden...</div>;

  // Spieler-Auswahl
  if (!currentPlayer) {
    const kernSpieler = spieler.filter(s => s.kern);
    const restSpieler = spieler.filter(s => !s.kern);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Wer bist du?</h2>
        <p className="text-sm text-gray-500">Kern-Mannschaft (WhatsApp-Gruppe)</p>
        <div className="grid grid-cols-2 gap-2">
          {kernSpieler.map(s => (
            <button type="button" key={s.id} onClick={() => selectPlayer(s)}
              className="bg-white rounded-lg shadow p-3 text-left hover:bg-green-50 hover:border-green-500 border-2 border-transparent transition">
              <span className="font-medium text-sm">{s.name}</span>
              <span className="block text-xs text-gray-400">LK {s.lk}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setShowAlle(!showAlle)}
          className="text-sm text-blue-600 hover:text-blue-800">
          {showAlle ? 'Weniger anzeigen ▲' : `Weitere Spieler anzeigen (${restSpieler.length}) ▼`}
        </button>

        {showAlle && (
          <div className="grid grid-cols-2 gap-2">
            {restSpieler.map(s => (
              <button type="button" key={s.id} onClick={() => selectPlayer(s)}
                className="bg-gray-50 rounded-lg shadow-sm p-3 text-left hover:bg-green-50 border border-gray-200 transition">
                <span className="font-medium text-sm">{s.name}</span>
                <span className="block text-xs text-gray-400">LK {s.lk}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Hallo {currentPlayer.name}</h2>
        <button type="button" onClick={() => { setCurrentPlayer(null); localStorage.removeItem('meden_current_player_id'); }}
          className="text-sm text-gray-500 hover:text-gray-700">Spieler wechseln</button>
      </div>
      {currentPlayer.id === 's61' && (
        <a href="/admin" className="block text-sm text-blue-600 hover:underline mb-1">📊 Admin-Übersicht</a>
      )}
      <p className="text-sm text-gray-600">Klicke auf ✅ Dabei — der Termin wird direkt in deinen Kalender übernommen.</p>

      {spieltage.map(st => {
        const myStatus = getStatus(st.id, currentPlayer.id);
        const zusagen = getZusagen(st.id);
        const unsichere = getUnsichere(st.id);
        const zuWenig = zusagen.length < 6;
        const genug = zusagen.length >= 6;
        const gegner = st.heim ? st.gastmannschaft : st.heimmannschaft;
        const cardClass = zuWenig ? 'bg-red-50 border-2 border-red-200' : genug ? 'bg-green-50 border-2 border-green-200' : 'bg-white';

        return (
          <div key={st.id} className={`rounded-lg shadow p-4 ${cardClass}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{formatDatum(st.datum)} {st.uhrzeit}</p>
                <p className="text-sm text-gray-600">Nr. {st.nr} · {st.heim ? '🏠 Heim' : '🚗 Auswärts'} · vs {gegner}</p>
              </div>
              <span className={`text-sm font-medium px-2 py-1 rounded ${zuWenig ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {zusagen.length}/6
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <button type="button"
                onClick={() => { setVerfuegbarkeitHandler(st.id, 'ja'); downloadICS(st); }}
                className={`flex-1 py-2 rounded text-sm font-medium transition ${myStatus === 'ja' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100'}`}>
                ✅ Dabei
              </button>
              <button type="button"
                onClick={() => setVerfuegbarkeitHandler(st.id, 'unsicher')}
                className={`flex-1 py-2 rounded text-sm font-medium transition ${myStatus === 'unsicher' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'}`}>
                ❓ Unsicher
              </button>
              <button type="button"
                onClick={() => setVerfuegbarkeitHandler(st.id, 'nein')}
                className={`flex-1 py-2 rounded text-sm font-medium transition ${myStatus === 'nein' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100'}`}>
                ❌ Nein
              </button>
            </div>

            {zusagen.length > 0 && (
              <div className="border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500 mb-1">Dabei ({zusagen.length}):</p>
                <p className="text-sm text-gray-700">{zusagen.map(s => s.name).join(', ')}</p>
              </div>
            )}
            {unsichere.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-400">Unsicher: {unsichere.map(s => s.name).join(', ')}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
