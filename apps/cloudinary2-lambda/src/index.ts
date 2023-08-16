import serverless from 'serverless-http';
import { bootstrap } from './app';

export const handler = serverless(bootstrap());
