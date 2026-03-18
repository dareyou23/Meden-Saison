import { Spieltag } from './api';

export function generateICS(spieltag: Spieltag): string {
  const [year, month, day] = spieltag.datum.split('-');
  const [hour, min] = spieltag.uhrzeit.split(':');
  const dtStart = `${year}${month}${day}T${hour}${min}00`;

  // Spiel dauert ca. 4 Stunden
  const endH = (parseInt(hour) + 4).toString().padStart(2, '0');
  const dtEnd = `${year}${month}${day}T${endH}${min}00`;

  const gegner = spieltag.heim ? spieltag.gastmannschaft : spieltag.heimmannschaft;
  const ort = spieltag.heim ? 'TC Bayer Dormagen, Tennisanlage' : gegner;
  const summary = spieltag.heim
    ? `Meden Heimspiel vs ${gegner}`
    : `Meden Auswärts bei ${gegner}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meden-Saison//DE',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${ort}`,
    `DESCRIPTION:Spieltag Nr. ${spieltag.nr} - ${spieltag.heimmannschaft} vs ${spieltag.gastmannschaft}`,
    `UID:meden-${spieltag.id}@dormagen`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(spieltag: Spieltag) {
  const ics = generateICS(spieltag);

  // Auf iOS/Android: data-URI öffnet direkt die Kalender-App
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS || isAndroid) {
    // Mobile: window.open mit data-URI → Kalender-App öffnet sich
    const dataUri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    window.open(dataUri, '_blank');
  } else {
    // Desktop: normaler Download
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meden-spieltag-${spieltag.nr}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
