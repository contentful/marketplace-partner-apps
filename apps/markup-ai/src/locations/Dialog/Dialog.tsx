import { useState, useEffect, useCallback } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AnalysisResultsComparison } from '../../components/Dialog/AnalysisResultsComparison/AnalysisResultsComparison';
import { ContentDiff } from '../../components/Dialog/ContentDiff/ContentDiff';
import { DialogActions } from '../../components/Dialog/DialogActions/DialogActions';
import {
  DialogContainer,
  DialogContent,
  DialogHeader,
  DialogTitle,
  CenteredContent,
  ActionsWrapper,
  CompanyLogo,
} from './Dialog.styles';
import { LoadingState } from '../../components/LoadingState/LoadingState';
import { rewriteContent } from '../../services/rewriterService';
import { Button } from '@contentful/f36-components';
import { FieldCheck } from '../../types/content';

interface DialogParameters {
  fieldId?: string;
  original: string;
  startRewrite?: boolean;
  originalScore?: number | null;
  previewFormat?: 'markdown' | 'html';
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const parameters = sdk.parameters.invocation as unknown as DialogParameters;

  const [loading, setLoading] = useState(!!parameters.startRewrite);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FieldCheck | null>(null);

  const triggerRewrite = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // API key from installation, per-user preferences from local storage
      const stored = window.localStorage;
      const apiKey = sdk.parameters.installation.apiKey || '';
      const dialect = stored.getItem('markupai.dialect') || undefined;
      const tone = stored.getItem('markupai.tone') || undefined;
      const styleGuide = stored.getItem('markupai.styleGuide') || undefined;
      const config = { apiKey, dialect, tone, styleGuide };
      // Call rewrite service
      const rewrite = await rewriteContent(parameters.fieldId!, parameters.original, config);
      if (!rewrite || !rewrite.hasRewriteResult || !rewrite.checkResponse) {
        throw new Error('No rewrite result received');
      }
      setResult(rewrite);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while rewriting content');
      }
    } finally {
      setLoading(false);
    }
  }, [parameters.fieldId, parameters.original]);

  useEffect(() => {
    if (parameters.startRewrite) {
      triggerRewrite();
    }
  }, []);

  useEffect(() => {
    sdk.window.updateHeight();
  }, [loading]);

  const handleAccept = () => {
    if (result && result.checkResponse && 'rewrite' in result.checkResponse) {
      console.log('result.checkResponse', result.checkResponse);
      sdk.close({
        accepted: true,
        value: result.checkResponse.rewrite,
        fieldId: parameters.fieldId,
        rewriteResponse: result.checkResponse,
      });
    }
  };
  const handleReject = () => {
    sdk.close({ accepted: false });
  };

  const handleRewriteAgain = () => {
    triggerRewrite();
  };

  let content = null;
  if (loading) {
    content = (
      <CenteredContent>
        <LoadingState message="Markup AI is rewriting the content" />
      </CenteredContent>
    );
  } else if (error) {
    content = (
      <CenteredContent>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ color: '#D14343', marginBottom: 16, fontWeight: 500 }}>{error}</div>
          <Button variant="secondary" onClick={triggerRewrite}>
            Retry
          </Button>
        </div>
      </CenteredContent>
    );
  } else if (result) {
    if (result.checkResponse) {
      const improvedScores = 'rewrite_scores' in result.checkResponse ? result.checkResponse.rewrite_scores : null;
      console.log('Dialog - improvedScores:', improvedScores);
      console.log('workflow_id:', result.checkResponse.workflow_id);
      if (improvedScores) {
        const initialScores = 'scores' in result.checkResponse ? result.checkResponse.scores : null;
        content = (
          <>
            <DialogHeader>
              <DialogTitle>Improvement Summary</DialogTitle>
              <CompanyLogo src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />
            </DialogHeader>
            {initialScores && <AnalysisResultsComparison initial={initialScores} improved={improvedScores} />}
            <ContentDiff
              original={parameters.original}
              improved={'rewrite' in result.checkResponse ? result.checkResponse.rewrite : ''}
              originalScore={parameters.originalScore ?? 0}
              improvedScore={improvedScores.quality.score}
              previewFormat={parameters.previewFormat ?? 'markdown'}
            />
          </>
        );
      } else {
        content = null;
      }
    } else {
      content = null;
    }
  }

  return (
    <DialogContainer $fixedHeight={loading}>
      <DialogContent>
        {content}
        <ActionsWrapper>
          <DialogActions
            onReject={handleReject}
            onAccept={handleAccept}
            onRewriteAgain={handleRewriteAgain}
            disabled={loading || !!error || !result}
            showRewriteAgain={!!result && !loading && !error}
            workflowId={
              result?.checkResponse && 'workflow_id' in result.checkResponse
                ? result.checkResponse.workflow_id
                : undefined
            }
          />
        </ActionsWrapper>
      </DialogContent>
    </DialogContainer>
  );
};

export default Dialog;
