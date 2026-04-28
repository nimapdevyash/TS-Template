import { environment } from '../enums/common.js';

export const isProduction = process.env.NODE_ENV === environment.production;
export const REQUEST_ID_HEADER = 'x-request-id';
