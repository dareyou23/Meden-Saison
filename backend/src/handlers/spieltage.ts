import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { queryItems } from '../utils/dynamodb';

// GET /spieltage — alle Spieltage laden
export async function listSpieltage(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const items = await queryItems('SAISON#sommer2026', 'SPIELTAG#');
    const spieltage = items
      .map(item => ({
        id: item.spieltagId,
        nr: item.nr,
        datum: item.datum,
        uhrzeit: item.uhrzeit,
        heimmannschaft: item.heimmannschaft,
        gastmannschaft: item.gastmannschaft,
        heim: item.heim,
      }))
      .sort((a, b) => a.datum.localeCompare(b.datum));
    return successResponse(spieltage);
  } catch (error) {
    console.error('List spieltage error:', error);
    return errorResponse('Internal server error', 500);
  }
}
