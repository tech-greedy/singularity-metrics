import { Context, APIGatewayProxyResult } from 'aws-lambda';
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";
import { decompress } from '@xingrz/cppzst';
import * as geoip from "geoip-lite";
import {Lookup} from "geoip-lite";
import {Client} from 'pg';

type SingularityEvent = {
  timestamp: number,
  instance: string,
  type: string,
  values: {[key: string]: any },
}

function getLocation(ip: string) : null | Lookup {
  const geo = geoip.lookup(ip);
  return geo;
}

const insertStatementBase = 'INSERT INTO events (timestamp, ip, instance, type, values, latitude, longitude) VALUES ';
function getInsertStatement(batch: number): string {
  let j = 1;
  let result = '';
  for (let i = 0; i < batch; i++) {
    result += `($${j++}, $${j++}, $${j++}, $${j++}, $${j++}, $${j++}, $${j++})`;
    if (i < batch - 1) {
      result += ', ';
    }
  }
  return insertStatementBase + result;
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

  const geo = getLocation(event.requestContext.http.sourceIp);
  const latitude = geo?.ll[0];
  const longitude = geo?.ll[1];

  const queryText = getInsertStatement(events.length);
  const values = [];
  for (const e of events) {
    values.push(e.timestamp, event.requestContext.http.sourceIp, e.instance, e.type, JSON.stringify(e.values), latitude, longitude)
  }

  const client = new Client({
    database: dbName,
  });
  await client.connect();
  await client.query({
    text: queryText,
    values: values,
  });
  await client.end();

  return {
    statusCode: 200,
    body: ''
  };
}
