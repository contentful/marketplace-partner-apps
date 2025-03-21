export interface IApiError {
    message: string;
    status?: number;
    type?: 'unauthorized' | 'network' | 'other';
  }
