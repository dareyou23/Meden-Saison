import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';
import { putItem, queryItems } from '../utils/dynamodb';

const VerfuegbarkeitSchema = z.object({
  spieltagId: z.string().min(1),
  spielerId: z.string().min(1),
  status: z.enum(['ja', 'nein', 'unsicher', '']),
});

// POST /verfuegbarkeit — Verfügbarkeit setzen
export async function setVerfuegbarkeit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) return errorResponse('Request body required');
    const body = VerfuegbarkeitSchema.parse(JSON.parse(event.body));
    const now = new Date().toISOString();

    await putItem({
      PK: `SPIELTAG#${body.spieltagId}`,
      SK: `VERFUEGBARKEIT#${body.spielerId}`,
      GSI1PK: `SPIELER#${body.spielerId}`,
      GSI1SK: `VERFUEGBARKEIT#${body.spieltagId}`,
      spieltagId: body.spieltagId,
      spielerId: body.spielerId,
      status: body.status,
      updatedAt: now,
      entityType: 'VERFUEGBARKEIT',
    });

    return successResponse({ spieltagId: body.spieltagId, spielerId: body.spielerId, status: body.status });
  } catch (error) {
    console.error('Set verfuegbarkeit error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /verfuegbarkeit/{spieltagId} — alle Verfügbarkeiten für einen Spieltag
export async function getVerfuegbarkeit(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const spieltagId = event.pathParameters?.spieltagId;
    if (!spieltagId) return errorResponse('spieltagId required');

    const items = await queryItems(`SPIELTAG#${spieltagId}`, 'VERFUEGBARKEIT#');
    const result: Record<string, string> = {};
    for (const item of items) {
      result[item.spielerId] = item.status;
    }
    return successResponse(result);
  } catch (error) {
    console.error('Get verfuegbarkeit error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /verfuegbarkeit — alle Verfügbarkeiten aller Spieltage (für Admin-Übersicht)
export async function getAllVerfuegbarkeit(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Für jeden Spieltag die Verfügbarkeiten laden
    const spieltagIds = ['st1', 'st2', 'st3', 'st4', 'st5'];
    const result: Record<string, Record<string, string>> = {};

    for (const stId of spieltagIds) {
      const items = await queryItems(`SPIELTAG#${stId}`, 'VERFUEGBARKEIT#');
      result[stId] = {};
      for (const item of items) {
        result[stId][item.spielerId] = item.status;
      }
    }
    return successResponse(result);
  } catch (error) {
    console.error('Get all verfuegbarkeit error:', error);
    return errorResponse('Internal server error', 500);
  }
}
