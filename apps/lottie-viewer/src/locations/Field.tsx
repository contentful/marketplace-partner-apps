import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import LottiePreviewField from '@src/components/field/LottiePreviewField';

export type LottieJSON = {
  v: string;         // version
  fr: number;        // frame rate
  ip: number;        // in point
  op: number;        // out point
  w?: number;        // width
  h?: number;        // height
  nm?: string;       // name
  ddd?: number;      // 3d layer
  assets?: any[];    // array of assets
  layers?: any[];    // array of layers
  [key: string]: any; // fallback for unknown props
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [lottieJson, setLottieJson] = useState<LottieJSON | Record<string, unknown>>();
  const handleLottieJsonChange = (value: LottieJSON | Record<string, unknown>) => {
    setLottieJson(value);
  };

  useEffect(() => {
    sdk.window.startAutoResizer();

    const value = sdk.field.getValue();
    if (value) {
      setLottieJson(value);
    }
    else {
      setLottieJson({});
    }

  }, [sdk]);

  return (
    <>
      {
        lottieJson && <LottiePreviewField lottieJson={lottieJson} onLottieJsonChange={handleLottieJsonChange} />
      }
    </>
  );
};

export default Field;