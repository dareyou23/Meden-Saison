export interface Spieltag {
  id: string;
  nr: number;
  datum: string;
  uhrzeit: string;
  heimmannschaft: string;
  gastmannschaft: string;
  heim: boolean;
}

export const SPIELTAGE: Spieltag[] = [
  { id: 'st1', nr: 574, datum: '2026-05-02', uhrzeit: '14:30', heimmannschaft: 'TK GG Köln 1', gastmannschaft: 'TC Bayer Dormagen 4', heim: false },
  { id: 'st2', nr: 577, datum: '2026-05-16', uhrzeit: '14:30', heimmannschaft: 'KTC 71 1', gastmannschaft: 'TC Bayer Dormagen 4', heim: false },
  { id: 'st3', nr: 581, datum: '2026-06-13', uhrzeit: '14:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TC RW Opladen 1', heim: true },
  { id: 'st4', nr: 585, datum: '2026-06-27', uhrzeit: '14:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TV Ensen Westhoven 2', heim: true },
  { id: 'st5', nr: 587, datum: '2026-09-05', uhrzeit: '13:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TC Ford Köln 2', heim: true },
];

export interface Spieler {
  id: string;
  pos: number;
  name: string;
  lk: string;
  kern: boolean;
}

// HINWEIS: Spielerdaten kommen aus der Datenbank (API).
// Diese Datei enthält nur noch die Typ-Definitionen und Spieltage.
// Das SPIELER-Array wurde aus Datenschutzgründen entfernt.

export type Verfuegbarkeit = 'ja' | 'nein' | 'unsicher' | '';
