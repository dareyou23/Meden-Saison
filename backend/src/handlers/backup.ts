import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3Client = new S3Client({});
const TABLE_NAME = process.env.TABLE_NAME || 'MedenSaison';
const BUCKET_NAME = process.env.BACKUP_BUCKET || '';

async function scanAll(): Promise<any[]> {
  const items: any[] = [];
  let lastKey: any = undefined;
  do {
    const res = await ddbClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

function computeHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function getLastHash(): Promise<string | null> {
  try {
    const res = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'meta/last-hash.txt',
    }));
    return (await res.Body?.transformToString()) || null;
  } catch {
    return null;
  }
}

async function saveHash(hash: string): Promise<void> {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: 'meta/last-hash.txt',
    Body: hash,
    ContentType: 'text/plain',
  }));
}

async function cleanupDailyBackups(): Promise<void> {
  // Tägliche Backups: nur die letzten 30 Tage behalten
  const res = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'daily/',
  }));
  const objects = (res.Contents || []).sort((a, b) =>
    (b.Key || '').localeCompare(a.Key || '')
  );

  // Alles älter als 30 Tage löschen (außer Monats-Backups)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  for (const obj of objects) {
    if (obj.LastModified && obj.LastModified < cutoff) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.Key,
      }));
      console.log('Deleted daily backup:', obj.Key);
    }
  }
}

async function promoteMonthlyBackup(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

  // Nur am letzten Tag des Monats das Monats-Backup erstellen
  if (now.getDate() !== lastDay) return;

  // Heutiges Daily-Backup als Monthly kopieren
  const todayPrefix = `daily/${year}-${month}-${now.getDate().toString().padStart(2, '0')}`;
  const res = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: todayPrefix,
  }));

  if (res.Contents && res.Contents.length > 0) {
    const sourceKey = res.Contents[0].Key!;
    // Lese das Daily-Backup und schreibe es als Monthly
    const getRes = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sourceKey,
    }));
    const body = await getRes.Body?.transformToString();
    if (body) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `monthly/${year}-${month}.json`,
        Body: body,
        ContentType: 'application/json',
      }));
      console.log(`Monthly backup created: monthly/${year}-${month}.json`);
    }
  }

  // Monats-Backups: nur 14 behalten
  const monthlyRes = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'monthly/',
  }));
  const monthlyObjects = (monthlyRes.Contents || []).sort((a, b) =>
    (b.Key || '').localeCompare(a.Key || '')
  );
  // Die ältesten über 14 löschen
  for (let i = 14; i < monthlyObjects.length; i++) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: monthlyObjects[i].Key,
    }));
    console.log('Deleted old monthly backup:', monthlyObjects[i].Key);
  }
}

export async function handler(_event: ScheduledEvent): Promise<void> {
  console.log('Backup started at', new Date().toISOString());

  if (!BUCKET_NAME) {
    console.error('BACKUP_BUCKET not set');
    return;
  }

  // 1. Alle Daten scannen
  const items = await scanAll();
  const jsonData = JSON.stringify(items, null, 2);
  const currentHash = computeHash(jsonData);

  // 2. Prüfen ob sich was geändert hat
  const lastHash = await getLastHash();
  if (lastHash === currentHash) {
    console.log('Keine Änderungen seit letztem Backup. Übersprungen.');
    // Trotzdem Monthly-Promotion prüfen (falls letzter Tag im Monat)
    await promoteMonthlyBackup();
    return;
  }

  // 3. Daily-Backup schreiben
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toISOString().split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
  const key = `daily/${dateStr}_${timeStr}.json`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: jsonData,
    ContentType: 'application/json',
    Metadata: {
      'item-count': items.length.toString(),
      'data-hash': currentHash,
    },
  }));
  console.log(`Backup saved: ${key} (${items.length} items, hash: ${currentHash.slice(0, 8)}...)`);

  // 4. Hash speichern
  await saveHash(currentHash);

  // 5. Cleanup + Monthly-Promotion
  await cleanupDailyBackups();
  await promoteMonthlyBackup();

  console.log('Backup completed.');
}
