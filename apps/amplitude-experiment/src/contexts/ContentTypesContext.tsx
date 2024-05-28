import { useSDK } from "@contentful/react-apps-toolkit";
import { ContentTypeProps } from "contentful-management";
import { createContext, useEffect, useState } from "react";
import { VARIANT_CONTAINER } from "../utils/shared";

interface ContentTypesContextProps {
  contentTypes: Array<ContentTypeProps>;
}

export const ContentTypesContext = createContext<ContentTypesContextProps>({
  contentTypes: [],
});

export const ContentTypesProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const sdk = useSDK();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const contentTypes = await sdk.cma.contentType.getMany({ query: { "sys.id[ne]": VARIANT_CONTAINER }});
      return contentTypes;
    };
    fetchData().then((contentTypes) => setContentTypes(contentTypes.items));
  }, [sdk.cma.contentType]);

  return (
    <ContentTypesContext.Provider value={{ contentTypes }}>
      {children}
    </ContentTypesContext.Provider>
  );
};
