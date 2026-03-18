import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { docClient, TABLE_NAME } from '../utils/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// GET /spieler — alle Spieler laden
export async function listSpieler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :type',
      ExpressionAttributeValues: { ':type': 'SPIELER' },
    }));
    const spieler = (result.Items || [])
      .map(item => ({
        id: item.spielerId,
        pos: item.pos,
        name: item.name,
        lk: item.lk,
        kern: item.kern,
      }))
      .sort((a, b) => a.pos - b.pos);
    return successResponse(spieler);
  } catch (error) {
    console.error('List spieler error:', error);
    return errorResponse('Internal server error', 500);
  }
}
