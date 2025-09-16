import { StyleScores } from '@markupai/toolkit';
export interface RewriteDialogParams {
  startRewrite: boolean;
  fieldId: string;
  original: string;
  originalScore?: number | null;
}

export interface MoreDetailsDialogParams {
  scores: StyleScores;
}
