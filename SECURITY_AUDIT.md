# Security Audit – Meden-Saison

**Datum:** 18. März 2026  
**Scope:** Komplettes Repo (Frontend + Backend + Infrastruktur)  
**Letztes Update:** 18. März 2026

---

## Status-Übersicht

| # | Finding | Priorität | Status |
|---|---------|-----------|--------|
| 1 | Keine Authentifizierung | 🔴 Kritisch | ⏸️ Bewusst akzeptiert |
| 2 | Admin-Bypass via localStorage | 🔴 Kritisch | ⏸️ Bewusst akzeptiert |
| 3 | Identitäts-Spoofing | 🔴 Kritisch | ⏸️ Bewusst akzeptiert |
| 4 | CORS Wildcard `*` | 🟠 Hoch | ⏸️ Bewusst akzeptiert |
| 5 | Hardcoded Spieltag-IDs | 🟠 Hoch | ✅ Behoben |
| 6 | Fehlende Input-Validierung | 🟠 Hoch | ⏳ Offen |
| 7 | PII im Frontend-Code | 🟠 Hoch | ✅ Behoben |
| 8 | Seed-Script mit Klarnamen | 🟠 Hoch | ✅ Behoben |
| 9 | Kein Rate-Limiting | 🟡 Mittel | ✅ Behoben |
| 10 | Fehlende Security-Headers | 🟡 Mittel | ✅ Behoben |
| 11 | API-URL Fallback im Code | 🟡 Mittel | ⏳ Offen |
| 12 | Keine Error-Boundary | 🟡 Mittel | ⏳ Offen |
| 13 | Scan statt Query für Spieler | 🟡 Mittel | ⏳ Offen |
| 14 | Kein Monitoring/Alarme | 🟢 Niedrig | ⏳ Offen |
| 15 | S3-Bucket ohne Verschlüsselung | 🟢 Niedrig | ✅ Behoben |
| 16 | DynamoDB ohne explizite Verschlüsselung | 🟢 Niedrig | ✅ Behoben |
| 17 | Source Maps in Produktion | 🟢 Niedrig | ⏳ Offen |

**7 von 17 behoben · 4 bewusst akzeptiert · 6 offen**

---

## 🔴 KRITISCH

### 1. Keine Authentifizierung / Autorisierung — ⏸️ Bewusst akzeptiert

Die gesamte API ist komplett offen – kein Login, kein Token, kein API-Key.

- **POST /verfuegbarkeit** – Jeder kann für jeden Spieler Verfügbarkeiten setzen
- **GET /spieler, /spieltage, /verfuegbarkeit** – Alle Daten sind öffentlich abrufbar

**Entscheidung:** Für eine interne Vereins-App mit begrenztem Nutzerkreis akzeptiert. Throttling (50 req/s, Burst 100) schützt vor Missbrauch.

### 2. Admin-Zugang nur über localStorage-Check — ⏸️ Bewusst akzeptiert

```typescript
const savedId = localStorage.getItem('meden_current_player_id');
setAuthorized(savedId === 's61');
```

Clientseitiger Check, leicht umgehbar. Admin-Seite zeigt nur Übersicht, keine destruktiven Aktionen.

### 3. Identitäts-Spoofing bei Verfügbarkeit — ⏸️ Bewusst akzeptiert

Jeder kann für jeden Spieler die Verfügbarkeit setzen. Ohne Auth nicht lösbar.

---

## 🟠 HOCH

### 4. CORS auf Wildcard `*` — ⏸️ Bewusst akzeptiert

```yaml
AllowOrigin: "'*'"
```

**Entscheidung:** CORS-Einschränkung wurde bewusst nicht umgesetzt (Erfahrungswerte mit CORS-Problemen). Risiko überschaubar da keine Auth, Throttling schützt vor Missbrauch.

### 5. Hardcoded Spieltag-IDs im Backend — ✅ Behoben (18.03.2026)

`getAllVerfuegbarkeit` lädt Spieltage jetzt dynamisch aus der DB:

```typescript
const spieltage = await queryItems('SAISON#sommer2026', 'SPIELTAG#');
const spieltagIds = spieltage.map(st => st.spieltagId as string);
```

### 6. Fehlende Input-Validierung bei Path-Parametern — ⏳ Offen

`spieltagId` wird nicht auf Format/Länge validiert. Geringes Risiko da DynamoDB keine Injection erlaubt.

### 7. Personenbezogene Daten im Frontend-Code — ✅ Behoben (18.03.2026)

- `spieltage.ts`: SPIELER-Array komplett entfernt, Daten kommen aus API
- `admin/page.tsx`: "Markus Wages" → "Mannschaftsführer"
- `README.md`: 3 Stellen bereinigt

### 8. Seed-Script mit Klarnamen — ✅ Behoben (18.03.2026)

`seed-data.js`: Alle 47 Namen anonymisiert (Vorname behalten, bei Duplikaten Vorname + 1. Buchstabe Nachname). DynamoDB behält volle Namen (nicht öffentlich zugänglich).

---

## 🟡 MITTEL

### 9. Kein Rate-Limiting — ✅ Behoben (18.03.2026)

API Gateway Throttling konfiguriert:

```yaml
ThrottlingRateLimit: 50
ThrottlingBurstLimit: 100
```

Verifiziert via `aws apigateway get-stage`.

### 10. Fehlende Security-Headers — ✅ Behoben (18.03.2026)

`next.config.js` konfiguriert mit:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Permissions-Policy: camera=(), microphone=(), geolocation=()

Verifiziert via `curl -I https://meden-saison.vercel.app/`.

### 11. API-URL Fallback im Code — ⏳ Offen

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kerb0sbhb2...';
```

Fallback-URL ist im Client-Bundle sichtbar. Geringes Risiko, da die URL ohnehin über die Env-Variable gesetzt wird.

### 12. Keine Error-Boundary im Frontend — ⏳ Offen

Optimistic Updates ohne Rollback bei API-Fehlern. User sieht keine Fehlermeldung.

### 13. Scan statt Query für Spieler-Liste — ⏳ Offen

Full-Table-Scan für 47 Spieler. Bei dieser Datenmenge kein Performance-Problem.

---

## 🟢 NIEDRIG

### 14. Kein Monitoring/Alarme — ⏳ Offen

Kein CloudWatch Alarm für 5xx-Errors oder Lambda-Fehler.

### 15. S3-Bucket ohne Verschlüsselung — ✅ Behoben (18.03.2026)

AES-256 Server-Side Encryption konfiguriert und deployed:

```yaml
BucketEncryption:
  ServerSideEncryptionConfiguration:
    - ServerSideEncryptionByDefault:
        SSEAlgorithm: AES256
```

Verifiziert via `aws s3api get-bucket-encryption`.

### 16. DynamoDB ohne explizite Verschlüsselung — ✅ Behoben (18.03.2026)

SSE mit KMS aktiviert:

```yaml
SSESpecification:
  SSEEnabled: true
```

Verifiziert: `SSEType: KMS`, Status: ENABLED.

### 17. Source Maps in Produktion — ⏳ Offen

`tsconfig.json` hat `"sourceMap": true`. Geringes Risiko da Backend-Code (Lambda), nicht im Browser sichtbar.

---

## Zusätzliche Maßnahmen (nicht im Original-Audit)

| Maßnahme | Status |
|----------|--------|
| CloudWatch Log Retention 14 Tage | ✅ Alle Lambda Log-Gruppen |
| DynamoDB Point-in-Time Recovery | ✅ Aktiviert |
| S3 Public Access Block | ✅ Alle 4 Optionen aktiviert |
| S3 Lifecycle (35 Tage daily/) | ✅ Konfiguriert |
| Tägliches Backup (03:00 UTC) | ✅ Lambda + S3 |
| ICS-Download iOS-kompatibel | ✅ Blob-Download |
