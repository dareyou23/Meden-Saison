# Meden-Saison Backend

AWS SAM Backend für die Spielerverfügbarkeits-App.

## Struktur

```
backend/
├── src/
│   ├── handlers/
│   │   ├── spieltage.ts      # GET /spieltage
│   │   ├── spieler.ts        # GET /spieler
│   │   ├── verfuegbarkeit.ts # POST + GET /verfuegbarkeit
│   │   └── backup.ts         # Tägliches S3-Backup (EventBridge)
│   └── utils/
│       ├── dynamodb.ts       # DynamoDB-Client + Helper
│       └── response.ts       # CORS-Response-Helper
├── seed-data.js              # Spieltage + Spieler in DB laden
├── template.yaml             # SAM Template
├── package.json
└── tsconfig.json
```

## Befehle

```bash
# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Daten seeden (einmalig)
node seed-data.js

# Deployen (Steering-Regel beachten)
npm run build
rm -rf .aws-sam
sam build
sam deploy --resolve-s3 --stack-name meden-saison --capabilities CAPABILITY_IAM --region eu-central-1 --no-confirm-changeset
```

## Backup

- **PITR**: Aktiviert (35 Tage sekundengenau)
- **S3-Backup**: Täglich 03:00 UTC via EventBridge → Lambda
- **Change Detection**: SHA-256 Hash, Backup nur bei Änderungen
- **S3-Bucket**: `meden-saison-backups-654654495234`
- **Retention**: Dailys 30 Tage, Monthlys 14 Stück (letzter Tag im Monat)
- **Struktur**: `daily/YYYY-MM-DD_HH-MM-SS.json`, `monthly/YYYY-MM.json`

### Backup manuell auslösen

```bash
aws lambda invoke --function-name meden-saison-BackupFunction-w6DKVf5XCbRs \
  --region eu-central-1 --payload '{}' /tmp/backup-result.json
```

### Backups auflisten

```bash
aws s3 ls s3://meden-saison-backups-654654495234/ --recursive --region eu-central-1
```

### Wiederherstellen aus S3-Backup

```bash
# Backup herunterladen
aws s3 cp s3://meden-saison-backups-654654495234/daily/2026-03-18_21-45-06.json backup.json

# Items zurück in DynamoDB schreiben (Node.js Script)
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const client = new DynamoDBClient({ region: 'eu-central-1' });
const doc = DynamoDBDocumentClient.from(client);
const items = JSON.parse(fs.readFileSync('backup.json'));
(async () => {
  for (const item of items) {
    await doc.send(new PutCommand({ TableName: 'MedenSaison', Item: item }));
  }
  console.log('Restored', items.length, 'items.');
})();
"
```

### Wiederherstellen aus PITR

```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name MedenSaison \
  --target-table-name MedenSaison-Restored \
  --restore-date-time "2026-03-18T12:00:00Z" \
  --region eu-central-1
```

## Verfügbarkeits-Daten zurücksetzen

Alle Verfügbarkeits-Einträge löschen (Spieltage + Spieler bleiben erhalten):

```bash
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient({ region: 'eu-central-1' });
const doc = DynamoDBDocumentClient.from(client);
(async () => {
  const res = await doc.send(new ScanCommand({ TableName: 'MedenSaison', FilterExpression: 'entityType = :t', ExpressionAttributeValues: { ':t': 'VERFUEGBARKEIT' } }));
  for (const item of res.Items || []) {
    await doc.send(new DeleteCommand({ TableName: 'MedenSaison', Key: { PK: item.PK, SK: item.SK } }));
    console.log('Deleted:', item.PK, item.SK);
  }
  console.log('Done.', (res.Items || []).length, 'Einträge gelöscht.');
})();
"
```
