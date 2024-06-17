import { useState } from "react";

import { Button, Flex, SectionHeading } from "@contentful/f36-components";
import { ArrowBackwardIcon } from "@contentful/f36-icons";

import { ImportEntries } from "@/components/page/importEntries";
import { EditMapping } from "@/components/page/editMapping";
import { Welcome } from "@/components/page/welcome";
import { MultiStepImport } from "@/components/page/multiStepImport";
import TemplatesProvider from "@/context/templatesProvider";
import { AppScreens, ExtendedGCTemplate } from "@/type/types";
import MappedTemplatesList from "@/components/page/mappedTemplatesList";
import { appName, appVersion } from "@/appVersion/appVersion";

const Page = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ExtendedGCTemplate | null>(null);
  const [action, setAction] = useState<AppScreens | null>(null);
  const [importEntriesBack, setImportEntriesBack] = useState<AppScreens>(
    AppScreens.EditMapping
  );
  const [templatesBack, setTemplatesBack] = useState<AppScreens | null>(null);

  function selectTemplate(template: ExtendedGCTemplate) {
    setAction(AppScreens.EditMapping);
    setSelectedTemplate(template);
  }

  function importEntriesForTemplate(
    template: ExtendedGCTemplate,
    currentScreen: AppScreens
  ) {
    setAction(AppScreens.ImportEntries);
    setSelectedTemplate(template);
    if (currentScreen === AppScreens.EditMapping) {
      setImportEntriesBack(AppScreens.EditMapping);
    } else {
      setImportEntriesBack(AppScreens.ViewAllMappings);
    }
  }

  function renderView() {
    switch (action) {
      case AppScreens.SelectTemplate:
        return (
          <>
            <Navigation back={() => setAction(null)} />
            <MultiStepImport setTemplatesBack={setTemplatesBack} select={selectTemplate} />
          </>
        );
      case AppScreens.EditMapping:
        return (
          <>
            <Navigation
              back={() => {
                setSelectedTemplate(null);
                setAction(templatesBack);
              }}
            />
            {selectedTemplate && (
              <EditMapping
                key="import-templates"
                selectedTemplate={selectedTemplate}
                importEntriesForTemplate={importEntriesForTemplate}
              />
            )}
          </>
        );
      case AppScreens.ImportEntries:
        return (
          <>
            <Navigation
              back={() => {
                setAction(importEntriesBack);
              }}
            />
            {selectedTemplate && (
              <ImportEntries
                selectedTemplate={selectedTemplate}
                key="import-entries"
              />
            )}
          </>
        );
      case AppScreens.ViewAllMappings:
        return (
          <>
            <Navigation
              back={() => {
                setAction(null);
              }}
            />
            <MappedTemplatesList
              setTemplatesBack={setTemplatesBack}
              importEntriesForTemplate={importEntriesForTemplate}
              select={selectTemplate}
            />
          </>
        );
      default:
        return <Welcome setAction={setAction} />;
    }
  }

  return (
    <TemplatesProvider>
      <main style={{ padding: "1rem", position: "relative", maxWidth: "1260px", margin: "0 auto" }}>
        <SectionHeading style={{ position: "absolute", top: "16px", right: "16px" }}>
          {`${appName}, v${appVersion}`}
        </SectionHeading>
        {renderView()}
      </main>
    </TemplatesProvider>
  );
};

function Navigation({ back }: { back: () => void }) {
  return (
    <Flex flexDirection="row" justifyContent="flex-start">
      <Button
        variant="secondary"
        startIcon={<ArrowBackwardIcon />}
        onClick={back}
      >
        Back
      </Button>
    </Flex>
  );
}

export default Page;
