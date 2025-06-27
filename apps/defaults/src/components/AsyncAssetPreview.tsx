import { AssetCard } from "@contentful/f36-components";
import { useEffect, useState } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";

interface Props {
  id: string;
  fetchAsset: (id: string) => Promise<any>;
}

const AsyncAssetPreview = ({ id, fetchAsset }: Props) => {
  const [asset, setAsset] = useState<any | null>(null);
  const sdk = useSDK();

  useEffect(() => {
    let mounted = true;
    fetchAsset(id).then((a) => mounted && setAsset(a ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!asset) return <AssetCard size="small" isLoading title={id} />;

  const file = asset.fields?.file?.["en-US"] || asset.fields?.file;
  const url = file?.url
    ? file.url.startsWith("//")
      ? `https:${file.url}`
      : file.url
    : undefined;

  return (
    <AssetCard
      size="small"
      title={asset.fields?.title?.["en-US"] || asset.fields?.title || id}
      src={url}
      status={asset.sys?.publishedVersion ? "published" : "draft"}
      onClick={() => {
        (sdk as any).navigator?.openAsset?.(id, {
          slideIn: { waitForClose: true },
        });
      }}
    />
  );
};

export default AsyncAssetPreview;
