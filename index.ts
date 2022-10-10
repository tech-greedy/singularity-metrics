import { Context, APIGatewayProxyResult } from 'aws-lambda';
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";
import { decompress } from '@xingrz/cppzst';

import {Client} from 'pg';

type SingularityEvent = {
  timestamp: number,
  ip: string,
  instance: string,
  type: string,
  values: {[key: string]: any },
}

export async function handler (event: APIGatewayProxyEventV2, _: Context): Promise<APIGatewayProxyResult> {
  const data = Buffer.from(event.body!, 'base64');
  const decompressed = await decompress(data);
  let events = <SingularityEvent[]>JSON.parse(decompressed.toString('utf8'));
  console.log(`Received ${events.length} events`)
  let dbName = process.env.DBNAME_TEST
  if (event.queryStringParameters && event.queryStringParameters['prod'] == 'true') {
    dbName = process.env.DBNAME_PROD
  }
  const client = new Client({
    database: dbName,
  });
  await client.connect();
  const queryName = 'insert-event';
  const queryText = 'INSERT INTO events (timestamp, ip, instance, type, values) VALUES ($1, $2, $3, $4, $5)';
  for(const event of events) {
    await client.query({
      name: queryName,
      text: queryText,
      values: [event.timestamp, event.ip, event.instance, event.type, JSON.stringify(event.values)],
    });
  }
  return {
    statusCode: 200,
    body: ''
  };
}
