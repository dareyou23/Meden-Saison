import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.TABLE_NAME || 'MedenSaison';

export async function getItem(PK: string, SK: string) {
  const response = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK },
  }));
  return response.Item;
}

export async function putItem(item: any) {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
  return item;
}

export async function queryItems(PK: string, SKPrefix?: string) {
  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: SKPrefix
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: SKPrefix
      ? { ':pk': PK, ':sk': SKPrefix }
      : { ':pk': PK },
  }));
  return response.Items || [];
}

export async function queryGSI1(GSI1PK: string, GSI1SKPrefix?: string) {
  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: GSI1SKPrefix
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
      : 'GSI1PK = :pk',
    ExpressionAttributeValues: GSI1SKPrefix
      ? { ':pk': GSI1PK, ':sk': GSI1SKPrefix }
      : { ':pk': GSI1PK },
  }));
  return response.Items || [];
}

export async function deleteItem(PK: string, SK: string) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK },
  }));
}
