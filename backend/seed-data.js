// Seed-Script: Spieltage + Spieler in DynamoDB laden
// Ausführen: node seed-data.js

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'MedenSaison';

const SPIELTAGE = [
  { id: 'st1', nr: 574, datum: '2026-05-02', uhrzeit: '14:30', heimmannschaft: 'TK GG Köln 1', gastmannschaft: 'TC Bayer Dormagen 4', heim: false },
  { id: 'st2', nr: 577, datum: '2026-05-16', uhrzeit: '14:30', heimmannschaft: 'KTC 71 1', gastmannschaft: 'TC Bayer Dormagen 4', heim: false },
  { id: 'st3', nr: 581, datum: '2026-06-13', uhrzeit: '14:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TC RW Opladen 1', heim: true },
  { id: 'st4', nr: 585, datum: '2026-06-27', uhrzeit: '14:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TV Ensen Westhoven 2', heim: true },
  { id: 'st5', nr: 587, datum: '2026-09-05', uhrzeit: '13:30', heimmannschaft: 'TC Bayer Dormagen 4', gastmannschaft: 'TC Ford Köln 2', heim: true },
];

const SPIELER = [
  { id: 's27', pos: 1, name: 'Bernd Brinkmann', lk: '19,0', kern: true },
  { id: 's51', pos: 2, name: 'Peter Pelko', lk: '22,8', kern: true },
  { id: 's53', pos: 3, name: 'Jörg Fischer', lk: '23,0', kern: true },
  { id: 's61', pos: 4, name: 'Markus Wages', lk: '23,5', kern: true },
  { id: 's69', pos: 5, name: 'Holger von der Linden', lk: '24,6', kern: true },
  { id: 's59', pos: 6, name: 'Frank Bittel', lk: '23,4', kern: true },
  { id: 's57', pos: 7, name: 'Gregor Franzmann', lk: '23,1', kern: true },
  { id: 's63', pos: 8, name: 'Dirk Bisping', lk: '24,2', kern: true },
  { id: 's60', pos: 9, name: 'Peter Weber', lk: '23,4', kern: true },
  { id: 's76', pos: 10, name: 'Stefan Brimmers', lk: '25,0', kern: true },
  { id: 's88', pos: 11, name: 'Daniel Soltek', lk: '25,0', kern: true },
  { id: 's89', pos: 12, name: 'Michael Kartschewski', lk: '25,0', kern: true },
  { id: 's62', pos: 13, name: 'Bernhard Wünsche', lk: '23,7', kern: true },
  { id: 's25', pos: 25, name: 'Peter Missbach', lk: '18,9', kern: false },
  { id: 's26', pos: 26, name: 'Klaus Wiemann', lk: '18,9', kern: false },
  { id: 's28', pos: 28, name: 'Stefan Reitenberger', lk: '19,0', kern: false },
  { id: 's29', pos: 29, name: 'Stefan Förster', lk: '19,1', kern: false },
  { id: 's30', pos: 30, name: 'Hans-Walter Buckels', lk: '19,2', kern: false },
  { id: 's31', pos: 31, name: 'Michael Künzel', lk: '19,4', kern: false },
  { id: 's32', pos: 32, name: 'Markus Habrich', lk: '19,6', kern: false },
  { id: 's33', pos: 33, name: 'Michael Conrad', lk: '20,1', kern: false },
  { id: 's34', pos: 34, name: 'Dirk Hermes', lk: '20,1', kern: false },
  { id: 's35', pos: 35, name: 'Andreas Köpp', lk: '20,9', kern: false },
  { id: 's36', pos: 36, name: 'Christian Riedel', lk: '21,0', kern: false },
  { id: 's37', pos: 37, name: 'Murat Yesil', lk: '21,0', kern: false },
  { id: 's38', pos: 38, name: 'Peter Rentergent', lk: '21,1', kern: false },
  { id: 's39', pos: 39, name: 'Uwe Holländer', lk: '21,2', kern: false },
  { id: 's40', pos: 40, name: 'Stefan Raabe', lk: '21,3', kern: false },
  { id: 's41', pos: 41, name: 'Jonny Bartel', lk: '21,6', kern: false },
  { id: 's42', pos: 42, name: 'Frank Ritter', lk: '21,6', kern: false },
  { id: 's43', pos: 43, name: 'Thomas Döring', lk: '21,7', kern: false },
  { id: 's44', pos: 44, name: 'Frank Bresser', lk: '22,1', kern: false },
  { id: 's45', pos: 45, name: 'Klaus Mirschenz', lk: '22,1', kern: false },
  { id: 's46', pos: 46, name: 'Peter Keutmann', lk: '22,4', kern: false },
  { id: 's47', pos: 47, name: 'Manfred Zacheja', lk: '22,4', kern: false },
  { id: 's48', pos: 48, name: 'Michael Siems', lk: '22,6', kern: false },
  { id: 's49', pos: 49, name: 'Christian Hansen', lk: '22,5', kern: false },
  { id: 's50', pos: 50, name: 'Stefan Michels', lk: '22,7', kern: false },
  { id: 's52', pos: 52, name: 'Peter Frackowiak', lk: '22,8', kern: false },
  { id: 's55', pos: 55, name: 'Hans Dietrich Heimes', lk: '23,1', kern: false },
  { id: 's56', pos: 56, name: 'Rolf Hüsgen', lk: '23,1', kern: false },
  { id: 's65', pos: 65, name: 'Carsten Wendt', lk: '24,4', kern: false },
  { id: 's66', pos: 66, name: 'Stefan Golf', lk: '24,4', kern: false },
  { id: 's67', pos: 67, name: 'Hakan Yildiz', lk: '24,4', kern: false },
  { id: 's68', pos: 68, name: 'Uwe Grutz', lk: '24,4', kern: false },
  { id: 's70', pos: 70, name: 'Ulrich Holtmann', lk: '24,8', kern: false },
  { id: 's71', pos: 71, name: 'Daniel Schreiber', lk: '24,8', kern: false },
];

async function seed() {
  console.log('Seeding Spieltage...');
  for (const st of SPIELTAGE) {
    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: 'SAISON#sommer2026',
        SK: `SPIELTAG#${st.id}`,
        spieltagId: st.id,
        nr: st.nr,
        datum: st.datum,
        uhrzeit: st.uhrzeit,
        heimmannschaft: st.heimmannschaft,
        gastmannschaft: st.gastmannschaft,
        heim: st.heim,
        entityType: 'SPIELTAG',
      },
    }));
    console.log(`  ✓ Spieltag ${st.nr} (${st.datum})`);
  }

  console.log('\nSeeding Spieler...');
  for (const s of SPIELER) {
    await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `SPIELER#${s.id}`,
        SK: 'METADATA',
        GSI1PK: s.kern ? 'KERN#true' : 'KERN#false',
        GSI1SK: `POS#${String(s.pos).padStart(3, '0')}`,
        spielerId: s.id,
        pos: s.pos,
        name: s.name,
        lk: s.lk,
        kern: s.kern,
        entityType: 'SPIELER',
      },
    }));
    console.log(`  ✓ ${s.name}`);
  }

  console.log('\nDone! Seeded', SPIELTAGE.length, 'Spieltage und', SPIELER.length, 'Spieler.');
}

seed().catch(console.error);
