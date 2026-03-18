# Meden-Saison – Spielerverfügbarkeit

Spieltag-Verfügbarkeitsabfrage für die Medensaison Köln-Leverkusen Sommer 2026, TC Bayer Dormagen 4 – Herren 50.

## Übersicht

Spieler können ihre Verfügbarkeit für die 5 Spieltage der Saison eintragen (Dabei / Unsicher / Nein). Bei "Dabei" wird automatisch ein ICS-Kalendereintrag angeboten. Der Mannschaftsführer (Markus Wages) hat eine Admin-Übersicht mit Matrix aller Spieler × Spieltage.

## Architektur

```
Frontend (Next.js 16, Port 3002)
  └── API-Client → API Gateway
                      └── Lambda (Node.js 22, ARM64)
                            └── DynamoDB (MedenSaison)
```

## Backend (AWS SAM)

- **Stack**: `meden-saison` (eu-central-1)
- **API URL**: `https://kerb0sbhb2.execute-api.eu-central-1.amazonaws.com/prod/`
- **DynamoDB-Tabelle**: `MedenSaison` (PAY_PER_REQUEST, GSI1)
- **Runtime**: Node.js 22.x, ARM64

### API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | /spieltage | Alle Spieltage der Saison |
| GET | /spieler | Alle Spieler (sortiert nach Setzlisten-Position) |
| POST | /verfuegbarkeit | Verfügbarkeit setzen `{spieltagId, spielerId, status}` |
| GET | /verfuegbarkeit/{spieltagId} | Verfügbarkeiten für einen Spieltag |
| GET | /verfuegbarkeit/alle | Alle Verfügbarkeiten (Admin-Übersicht) |

### DynamoDB-Datenmodell

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| Spieltag | SAISON#sommer2026 | SPIELTAG#{id} | – | – |
| Spieler | SPIELER#{id} | METADATA | KERN#true/false | POS#001 |
| Verfügbarkeit | SPIELTAG#{spieltagId} | VERFUEGBARKEIT#{spielerId} | SPIELER#{spielerId} | VERFUEGBARKEIT#{spieltagId} |

### Deploy

```bash
cd Meden-Saison/backend
npm run build
rm -rf .aws-sam
sam build
sam deploy --resolve-s3 --stack-name meden-saison --capabilities CAPABILITY_IAM --region eu-central-1 --no-confirm-changeset
```

### Daten seeden

```bash
cd Meden-Saison/backend
node seed-data.js
```

## Frontend (Next.js)

- **Port**: 3002 (`npm run dev -p 3002`)
- **Spieler-Ansicht** (`/`): Spielerauswahl → Spieltage mit Verfügbarkeits-Buttons
- **Admin-Ansicht** (`/admin`): Nur für Markus Wages (s61), Matrix + Zusammenfassung
- **ICS-Download**: Bei "Dabei" wird Kalendereintrag angeboten (Mobile: direkte Kalender-Integration)

### Environment

```
NEXT_PUBLIC_API_URL=https://kerb0sbhb2.execute-api.eu-central-1.amazonaws.com/prod
```

## Spieler

13 Kern-Spieler (WhatsApp-Gruppe) + 34 weitere Spieler der 4. Mannschaft.
Kern-Reihenfolge: Bernd, Peter Pelko, Jörg, Markus, Holger, Frank, Gregor, Dirk, Peter Weber, Stefan, Daniel, Michael K., Bernhard.

## Backup-Strategie

- **PITR** (Point-in-Time Recovery): Aktiviert, 35 Tage Rollback auf jede Sekunde
- **Tägliches S3-Backup**: EventBridge → Lambda (03:00 UTC), nur bei Änderungen (SHA-256 Hash-Vergleich)
- **Monats-Archiv**: Am letzten Tag des Monats wird das Daily als Monthly-Backup kopiert
- **Retention**: Dailys 30 Tage, Monthlys 14 Stück
- **S3-Bucket**: `meden-saison-backups-654654495234`
- **Struktur**: `daily/YYYY-MM-DD_HH-MM-SS.json`, `monthly/YYYY-MM.json`, `meta/last-hash.txt`

## Nächste Schritte

- [ ] Frontend auf Vercel deployen
- [ ] Auth einbauen (JWT-basierte Spieler-Identifikation statt manuelle Auswahl)
- [ ] Blueprint in Meden-Team-Manager übernehmen
- [ ] CORS auf spezifische Domain einschränken nach Vercel-Deploy
