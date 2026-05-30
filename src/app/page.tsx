'use client';

import { useState, useEffect } from 'react';
import { api, Spieltag, Spieler, Verfuegbarkeit } from '@/lib/api';
import { downloadICS } from '@/lib/ics';

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
    <path d="M3 12l9-9 9 9"/><path d="M9 21V12h6v9"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
  </svg>
);

const AwayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
    <path d="M7 17m-2 0a2 2 0 104 0 2 2 0 10-4 0"/><path d="M17 17m-2 0a2 2 0 104 0 2 2 0 10-4 0"/><path d="M5 17H3v-4l2-5h9l4 5h3v4h-2"/><path d="M9 17h6"/><path d="M14 8V6"/>
  </svg>
);

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
    const prevStatus = getStatus(spieltagId, currentPlayer.id);
    const next = { ...data };
    if (!next[spieltagId]) next[spieltagId] = {};
    next[spieltagId][currentPlayer.id] = status;
    setData(next);
    const result = await api.setVerfuegbarkeit(spieltagId, currentPlayer.id, status);
    if (!result.success) {
      const rollback = { ...data };
      if (!rollback[spieltagId]) rollback[spieltagId] = {};
      rollback[spieltagId][currentPlayer.id] = prevStatus;
      setData(rollback);
      alert('Fehler beim Speichern. Bitte nochmal versuchen.');
    }
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

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Spieler-Auswahl
  if (!currentPlayer) {
    const kernSpieler = spieler.filter(s => s.kern);
    const restSpieler = spieler.filter(s => !s.kern);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Wer bist du?</h2>
          <p className="text-sm text-dove-300 mt-1">Wähle deinen Namen aus</p>
        </div>

        <div>
          <p className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-3">Kern-Mannschaft</p>
          <div className="grid grid-cols-2 gap-3">
            {kernSpieler.map(s => (
              <button type="button" key={s.id} onClick={() => selectPlayer(s)}
                className="card-clickable p-4 text-left">
                <span className="font-bold text-sm text-white">{s.name}</span>
                <span className="block text-xs text-dove-200 mt-0.5">LK {s.lk}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => setShowAlle(!showAlle)}
          className="text-sm text-accent-cyan font-bold hover:text-white transition-colors">
          {showAlle ? 'Weniger anzeigen ↑' : `Weitere Spieler (${restSpieler.length}) ↓`}
        </button>

        {showAlle && (
          <div className="grid grid-cols-2 gap-3">
            {restSpieler.map(s => (
              <button type="button" key={s.id} onClick={() => selectPlayer(s)}
                className="card-clickable p-4 text-left opacity-70 hover:opacity-100">
                <span className="font-bold text-sm text-white">{s.name}</span>
                <span className="block text-xs text-dove-200 mt-0.5">LK {s.lk}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Hallo {currentPlayer.name}</h2>
          <p className="text-xs text-dove-300">Tippe auf deinen Status pro Spieltag</p>
        </div>
        <button type="button" onClick={() => { setCurrentPlayer(null); localStorage.removeItem('meden_current_player_id'); }}
          className="text-sm font-bold text-accent-cyan hover:text-white px-3 py-2 rounded-xl hover:bg-dove-600 transition-all">
          Wechseln
        </button>
      </div>

      {currentPlayer.id === 's61' && (
        <a href="/admin" className="inline-flex items-center gap-1.5 text-sm text-accent-cyan font-bold hover:text-white transition-colors">
          📊 Admin-Übersicht
        </a>
      )}

      {/* Spieltage — aktive oben, vergangene unten */}
      {(() => {
        const now = new Date();
        const cutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 Tage nach Termin
        const aktive = spieltage.filter(st => new Date(st.datum + 'T23:59:59') >= cutoff);
        const vergangene = spieltage.filter(st => new Date(st.datum + 'T23:59:59') < cutoff);

        const renderSpieltag = (st: Spieltag, istVergangen: boolean) => {
          const myStatus = getStatus(st.id, currentPlayer.id);
          const zusagen = getZusagen(st.id);
          const unsichere = getUnsichere(st.id);
          const zuWenig = zusagen.length < 6;
          const gegner = st.heim ? st.gastmannschaft : st.heimmannschaft;

          return (
            <div key={st.id} className={`card p-5 ${istVergangen ? 'opacity-50' : ''}`}>
              {/* Spieltag-Info — eine Zeile */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-lg font-bold text-white">
                  <span className="text-dove-200">{st.heim ? <HomeIcon /> : <AwayIcon />}</span>
                  <span>{formatDatum(st.datum)} · {st.uhrzeit}</span>
                  <span className="text-dove-300">vs</span>
                  <span className="text-accent-cyan">{gegner}</span>
                  {istVergangen && <span className="text-xs text-dove-400 font-normal ml-1">gespielt</span>}
                </div>
                <span className={`badge text-sm ${zuWenig ? 'bg-accent-red/20 text-red-300 border border-red-400/30' : 'bg-accent-green/20 text-green-300 border border-green-400/30'}`}>
                  {zusagen.length}/6
                </span>
              </div>

              {/* Status-Buttons — nur bei aktiven Spieltagen */}
              {!istVergangen && (
                <div className="flex gap-2.5 mb-4">
                  <button type="button"
                    onClick={() => { setVerfuegbarkeitHandler(st.id, 'ja'); downloadICS(st); }}
                    className={`status-btn ${myStatus === 'ja'
                      ? 'bg-accent-green text-white border-green-400/50'
                      : 'bg-dove-600 text-green-300 hover:bg-dove-400 hover:text-green-200'}`}>
                    💪 Dabei
                  </button>
                  <button type="button"
                    onClick={() => setVerfuegbarkeitHandler(st.id, 'unsicher')}
                    className={`status-btn ${myStatus === 'unsicher'
                      ? 'bg-accent-yellow text-white border-yellow-400/50'
                      : 'bg-dove-600 text-yellow-300 hover:bg-dove-400 hover:text-yellow-200'}`}>
                    🤷 Unsicher
                  </button>
                  <button type="button"
                    onClick={() => setVerfuegbarkeitHandler(st.id, 'nein')}
                    className={`status-btn ${myStatus === 'nein'
                      ? 'bg-accent-red text-white border-red-400/50'
                      : 'bg-dove-600 text-red-300 hover:bg-dove-400 hover:text-red-200'}`}>
                    👎 Nein
                  </button>
                </div>
              )}

              {/* Zusagen */}
              {zusagen.length > 0 && (
                <div className={`pt-3 border-t border-dove-400/40 ${istVergangen ? '' : ''}`}>
                  <p className="text-xs font-bold text-green-300 uppercase tracking-wider mb-2">Dabei ({zusagen.length})</p>
                  <p className="text-sm text-white font-medium leading-relaxed">
                    {zusagen.map(s => s.name).join(', ')}
                  </p>
                </div>
              )}

              {/* Unsichere */}
              {unsichere.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-2">Unsicher ({unsichere.length})</p>
                  <p className="text-sm text-dove-100 font-medium leading-relaxed">
                    {unsichere.map(s => s.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          );
        };

        return (
          <>
            <div className="space-y-4">
              {aktive.map(st => renderSpieltag(st, false))}
            </div>

            {vergangene.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-bold text-dove-400 uppercase tracking-wider mb-3">Vergangene Spieltage</p>
                <div className="space-y-3">
                  {vergangene.map(st => renderSpieltag(st, true))}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
