# Konzept: Element/Matrix Integration

## Idee

WhatsApp-Gruppe ersetzen durch Element (Matrix-Protokoll) — datenschutzfreundlich, mit Bot-Integration für automatische Benachrichtigungen und Abrechnung.

## Was ist was?

- **Matrix** = offenes Protokoll (wie E-Mail)
- **Element** = die App/Client (wie Gmail für E-Mail)
- **Element X** = neuere, schnellere Version der App
- **Conduit** = leichtgewichtiger Matrix-Homeserver (Rust, wenig Ressourcen)
- App im Store: **"Element"** (iOS + Android), Web: app.element.io

## Architektur

```
Meden-Saison App (Vercel)
        ↓
    Lambda (Bot-Logik)
        ↓ Matrix Client-Server API
    Conduit Homeserver (Fargate oder EC2 t4g.micro, ~3€/Monat)
        ↓
    Element App (Spieler)
```

### Warum nicht serverless?

Matrix-Homeserver braucht persistente Verbindungen (Federation, Sync, WebSockets). Passt nicht zu Lambda. Conduit auf einer kleinen Instanz ist die pragmatische Lösung.

## Geplanter Flow

### Status-Updates
```
Spieler klickt "Dabei"  →  App speichert in DynamoDB
                        →  Bot postet in Element-Gruppe: "Müller ist dabei (5/6)"
```

### Abrechnung
```
MF erfasst Kosten      →  App berechnet Anteil pro Spieler
                        →  Bot schickt jedem seinen PayPal.me-Link via Element-DM
```

### Zahlungseingang
```
Spieler zahlt via PayPal  →  PayPal Webhook an Lambda
                          →  App markiert als bezahlt
                          →  Bot bestätigt: "Müller hat bezahlt ✓"
```

## PayPal-Integration

- **Voraussetzung:** PayPal Business-Konto (kostenlos upgraden)
- **Option A:** Transaction Search API (Polling, regelmäßig abfragen)
- **Option B:** Webhooks/IPN (Echtzeit, PayPal schickt Nachricht bei Zahlungseingang) ← bevorzugt
- **Matching:** Spieler-Name/E-Mail + Betrag → offener Saldo zuordnen
- **Alternative ohne API:** PayPal CSV-Export hochladen, App matcht automatisch

## Für die Spieler

- Element App installieren (iOS/Android) ODER Web-Version im Browser (app.element.io)
- Einladung zur Gruppe per Link
- Push-Notifications über die App
- Kein WhatsApp mehr nötig

## Nächste Schritte

1. [ ] Mannschaft fragen: Signal oder Element?
2. [ ] Bei Element: Conduit-Server aufsetzen (Fargate/EC2)
3. [ ] Bot-User registrieren
4. [ ] Bot-Logik in Lambda (Status-Updates posten)
5. [ ] Abrechnung fertig bauen (Meden-Saison + tc.club-app)
6. [ ] PayPal Business-Konto upgraden
7. [ ] PayPal Webhook einrichten
8. [ ] Alles zusammenstecken

## Kosten

| Komponente | Kosten |
|---|---|
| Conduit auf EC2 t4g.micro | ~3€/Monat |
| Element App | kostenlos |
| PayPal Business | kostenlos (Gebühren nur bei Warenverkäufen) |
| Lambda/DynamoDB | bestehendes Setup, minimal |
