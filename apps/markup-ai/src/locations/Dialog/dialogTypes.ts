import { ScoreOutput } from "../../api-client";
export interface RewriteDialogParams {
  startRewrite: boolean;
  fieldId: string;
  original: string;
  originalScore?: number | null;
}

export interface MoreDetailsDialogParams {
  scores: ScoreOutput;
}
