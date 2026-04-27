import { environment } from '../enums/common.js';

export const isProduction = process.env.NODE_ENV === environment.production;
