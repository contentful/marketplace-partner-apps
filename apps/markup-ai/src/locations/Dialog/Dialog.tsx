import { useState, useEffect, useCallback } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AnalysisResultsComparison } from "../../components/Dialog/AnalysisResultsComparison/AnalysisResultsComparison";
import { ContentDiff } from "../../components/Dialog/ContentDiff/ContentDiff";
import { DialogActions } from "../../components/Dialog/DialogActions/DialogActions";
import {
  DialogContainer,
  DialogContent,
  DialogHeader,
  DialogTitle,
  CenteredContent,
  ActionsWrapper,
  CompanyLogo,
} from "./Dialog.styles";
import { LoadingState } from "../../components/LoadingState/LoadingState";
import { useRewriterService } from "../../services/rewriterService";
import { Button } from "@contentful/f36-components";
import { FieldCheck } from "../../types/content";

interface DialogParameters {
  fieldId?: string;
  original: string;
  startRewrite?: boolean;
  originalScore?: number | null;
  previewFormat?: "markdown" | "html";
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const parameters = sdk.parameters.invocation as unknown as DialogParameters;

  const [loading, setLoading] = useState(!!parameters.startRewrite);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FieldCheck | null>(null);

  const stored = globalThis.localStorage;
  const apiKey = stored.getItem("markupai.apiKey") || "";
  const dialect = stored.getItem("markupai.dialect") || undefined;
  const tone = stored.getItem("markupai.tone") || undefined;
  const styleGuide = stored.getItem("markupai.styleGuide") || undefined;
  const config = { apiKey, dialect, tone, styleGuide };

  // Use the hook-based rewriter service
  const { rewriteContent } = useRewriterService(config);

  const triggerRewrite = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Call rewrite service
      if (!parameters.fieldId) {
        throw new Error("Field ID is required");
      }
      const rewrite = await rewriteContent(parameters.fieldId, parameters.original);
      if (!rewrite.hasRewriteResult || !rewrite.checkResponse) {
        throw new Error("No rewrite result received");
      }
      setResult(rewrite);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while rewriting content");
      }
    } finally {
      setLoading(false);
    }
  }, [parameters.fieldId, parameters.original, rewriteContent]);

  useEffect(() => {
    if (parameters.startRewrite) {
      void triggerRewrite();
    }
  }, []);

  useEffect(() => {
    sdk.window.updateHeight();
  }, [loading]);

  const handleAccept = () => {
    if (
      result?.checkResponse &&
      "rewrite" in result.checkResponse &&
      result.checkResponse.rewrite
    ) {
      console.log("result.checkResponse", result.checkResponse);
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
    void triggerRewrite();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <CenteredContent>
          <LoadingState message="Markup AI is rewriting the content" />
        </CenteredContent>
      );
    }
    if (error) {
      return (
        <CenteredContent>
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "#D14343", marginBottom: 16, fontWeight: 500 }}>{error}</div>
            <Button
              variant="secondary"
              onClick={() => {
                void triggerRewrite();
              }}
            >
              Retry
            </Button>
          </div>
        </CenteredContent>
      );
    }
    const checkResponse = result?.checkResponse;
    if (!checkResponse) return null;
    const rewrite = "rewrite" in checkResponse ? checkResponse.rewrite : undefined;
    const improvedScores = rewrite?.scores ?? null;
    if (!improvedScores) return null;
    const initialScores =
      "original" in checkResponse ? (checkResponse.original?.scores ?? null) : null;
    console.log("Dialog - improvedScores:", improvedScores);
    console.log("workflow_id:", checkResponse.workflow.id);
    return (
      <>
        <DialogHeader>
          <DialogTitle>Improvement Summary</DialogTitle>
          <CompanyLogo src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />
        </DialogHeader>
        {initialScores && (
          <AnalysisResultsComparison initial={initialScores} improved={improvedScores} />
        )}
        <ContentDiff
          original={parameters.original}
          improved={rewrite?.text ?? ""}
          originalScore={parameters.originalScore ?? 0}
          improvedScore={improvedScores.quality?.score ?? 0}
          previewFormat={parameters.previewFormat ?? "markdown"}
        />
      </>
    );
  };

  const checkResponse = result?.checkResponse;
  const workflowId =
    checkResponse && "workflow" in checkResponse
      ? (checkResponse.workflow as { id?: string } | undefined)?.id
      : undefined;

  return (
    <DialogContainer $fixedHeight={loading}>
      <DialogContent>
        {renderContent()}
        <ActionsWrapper>
          <DialogActions
            onReject={handleReject}
            onAccept={handleAccept}
            onRewriteAgain={handleRewriteAgain}
            disabled={loading || !!error || !result}
            showRewriteAgain={!!result && !loading && !error}
            workflowId={workflowId}
          />
        </ActionsWrapper>
      </DialogContent>
    </DialogContainer>
  );
};

export default Dialog;
