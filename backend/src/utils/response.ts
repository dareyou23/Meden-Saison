import { APIGatewayProxyResult } from 'aws-lambda';

const getCorsHeaders = () => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
};

export function successResponse<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ success: true, data }),
  };
}

export function errorResponse(error: string, statusCode = 400): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ success: false, error }),
  };
}
