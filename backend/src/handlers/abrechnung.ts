import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { queryItems, putItem, deleteItem } from '../utils/dynamodb';
import { v4 as uuidv4 } from 'uuid';

type Kategorie = 'baelle' | 'essen' | 'getraenke' | 'sonstiges';

const GUELTIGE_KATEGORIEN: Kategorie[] = ['baelle', 'essen', 'getraenke', 'sonstiges'];

// POST /abrechnung — Kosten erfassen
// Body: { spieltagId, kategorie, betrag, beschreibung?, anzahlSpieler }
export async function createAbrechnung(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) return errorResponse('Body erforderlich');

    const body = JSON.parse(event.body);
    const { spieltagId, kategorie, betrag, beschreibung, anzahlSpieler } = body as {
      spieltagId: string;
      kategorie: Kategorie;
      betrag: number;
      beschreibung?: string;
      anzahlSpieler: number;
    };

    // Validierung
    if (!spieltagId) return errorResponse('spieltagId erforderlich');
    if (!kategorie || !GUELTIGE_KATEGORIEN.includes(kategorie)) {
      return errorResponse('Ungültige Kategorie. Erlaubt: baelle, essen, getraenke, sonstiges');
    }
    if (!betrag || typeof betrag !== 'number' || betrag <= 0) {
      return errorResponse('Betrag muss eine positive Zahl sein');
    }
    if (!anzahlSpieler || typeof anzahlSpieler !== 'number' || anzahlSpieler < 1) {
      return errorResponse('anzahlSpieler muss mindestens 1 sein');
    }
    if (kategorie === 'sonstiges' && !beschreibung) {
      return errorResponse('Beschreibung ist bei Kategorie "sonstiges" erforderlich');
    }

    const anteilProSpieler = Math.round((betrag / anzahlSpieler) * 100) / 100;
    const kostenId = uuidv4();
    const now = new Date().toISOString();

    const item = {
      PK: `ABRECHNUNG#${spieltagId}`,
      SK: `KOSTEN#${kostenId}`,
      spieltagId,
      kostenId,
      kategorie,
      betrag,
      beschreibung: beschreibung || undefined,
      anzahlSpieler,
      anteilProSpieler,
      createdAt: now,
    };

    await putItem(item);
    return successResponse(item, 201);
  } catch (error) {
    console.error('Create abrechnung error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /abrechnung/{spieltagId} — Kosten eines Spieltags
export async function getAbrechnung(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const spieltagId = event.pathParameters?.spieltagId;
    if (!spieltagId) return errorResponse('spieltagId fehlt');

    const items = await queryItems(`ABRECHNUNG#${spieltagId}`, 'KOSTEN#');
    return successResponse(items);
  } catch (error) {
    console.error('Get abrechnung error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /abrechnung/{spieltagId}/{kostenId} — Kosten löschen
export async function deleteAbrechnung(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const spieltagId = event.pathParameters?.spieltagId;
    const kostenId = event.pathParameters?.kostenId;
    if (!spieltagId || !kostenId) return errorResponse('spieltagId und kostenId erforderlich');

    await deleteItem(`ABRECHNUNG#${spieltagId}`, `KOSTEN#${kostenId}`);
    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Delete abrechnung error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /abrechnung/alle — Alle Kosten aller Spieltage
export async function getAlleAbrechnung(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Alle Spieltage laden
    const spieltage = await queryItems('SAISON#sommer2026', 'SPIELTAG#');

    const result: Record<string, any[]> = {};
    for (const st of spieltage) {
      const kosten = await queryItems(`ABRECHNUNG#${st.spieltagId}`, 'KOSTEN#');
      if (kosten.length > 0) {
        result[st.spieltagId as string] = kosten;
      }
    }

    return successResponse(result);
  } catch (error) {
    console.error('Get alle abrechnung error:', error);
    return errorResponse('Internal server error', 500);
  }
}
