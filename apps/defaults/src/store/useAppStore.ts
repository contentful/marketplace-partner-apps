import { create } from "zustand";
import { AppInstallationParameters, FieldDefaultConfig } from "../types/config";
import {
  toggleFieldSelection as toggleFieldSelectionHelper,
  setLinkValue as setLinkValueHelper,
  setJsonValue as setJsonValueHelper,
  setDateConfig as setDateConfigHelper,
} from "../utils/parameterHelpers";
import { PlainClientAPI } from "contentful-management";
import { ConfigAppSDK } from "@contentful/app-sdk";

interface AppStore {
  parameters: AppInstallationParameters;
  contentTypes: any[];
  isLoadingCTs: boolean;

  cma: PlainClientAPI | null;
  sdk: ConfigAppSDK | null;

  expanded: Record<string, boolean>;
  searchTerm: string;

  assetCache: Record<string, any>;
  entryCache: Record<string, any>;

  setParameters: (p: AppInstallationParameters) => void;
  setContentTypes: (cts: any[]) => void;
  setIsLoadingCTs: (val: boolean) => void;
  setSearchTerm: (term: string) => void;

  addAssetToCache: (id: string, asset: any) => void;
  addEntryToCache: (id: string, entry: any) => void;

  toggleExpand: (ctId: string) => void;
  toggleFieldSelection: (
    ctId: string,
    fieldId: string,
    fieldType: FieldDefaultConfig["fieldType"]
  ) => void;
  setLinkValue: (
    ctId: string,
    fieldId: string,
    linkType: "Asset" | "Entry",
    idValue: string | string[]
  ) => void;
  setJsonValue: (ctId: string, fieldId: string, value: any) => void;
  setDateConfig: (
    ctId: string,
    fieldId: string,
    val: FieldDefaultConfig["defaultValue"]
  ) => void;

  setCma: (cma: PlainClientAPI) => void;

  getAssetPreview: (assetId: string) => Promise<any | undefined>;
  getEntryPreview: (entryId: string) => Promise<any | undefined>;

  bootstrap: (sdk: ConfigAppSDK, cma: PlainClientAPI) => Promise<void>;

  getExternalParams: () => any;

  selectAsset: (
    ctId: string,
    fieldId: string,
    multiple?: boolean
  ) => Promise<void>;
  selectEntry: (
    ctId: string,
    fieldId: string,
    multiple?: boolean
  ) => Promise<void>;
}

export const useAppStore = create<AppStore>((set: any, get: any) => ({
  parameters: {},
  contentTypes: [],
  isLoadingCTs: true,

  expanded: {},
  searchTerm: "",

  assetCache: {},
  entryCache: {},

  cma: null,
  sdk: null,

  setParameters: (p: AppInstallationParameters) => set({ parameters: p }),
  setContentTypes: (cts: any[]) => set({ contentTypes: cts }),
  setIsLoadingCTs: (val: boolean) => set({ isLoadingCTs: val }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  addAssetToCache: (id: string, asset: any) =>
    set((state: AppStore) => ({
      assetCache: { ...state.assetCache, [id]: asset },
    })),
  addEntryToCache: (id: string, entry: any) =>
    set((state: AppStore) => ({
      entryCache: { ...state.entryCache, [id]: entry },
    })),

  toggleExpand: (ctId: string) =>
    set((state: AppStore) => ({
      expanded: { ...state.expanded, [ctId]: !state.expanded[ctId] },
    })),

  toggleFieldSelection: (
    ctId: string,
    fieldId: string,
    fieldType: FieldDefaultConfig["fieldType"]
  ) =>
    set((state: AppStore) => ({
      parameters: toggleFieldSelectionHelper(
        state.parameters,
        ctId,
        fieldId,
        fieldType
      ),
    })),
  setLinkValue: (
    ctId: string,
    fieldId: string,
    linkType: "Asset" | "Entry",
    idValue: string | string[]
  ) =>
    set((state: AppStore) => ({
      parameters: setLinkValueHelper(
        state.parameters,
        ctId,
        fieldId,
        linkType,
        idValue
      ),
    })),
  setJsonValue: (ctId: string, fieldId: string, value: any) =>
    set((state: AppStore) => ({
      parameters: setJsonValueHelper(state.parameters, ctId, fieldId, value),
    })),
  setDateConfig: (
    ctId: string,
    fieldId: string,
    val: FieldDefaultConfig["defaultValue"]
  ) =>
    set((state: AppStore) => ({
      parameters: setDateConfigHelper(state.parameters, ctId, fieldId, val),
    })),

  setCma: (cma: PlainClientAPI) => set({ cma }),

  getAssetPreview: async (assetId: string) => {
    const state = get();
    if (state.assetCache[assetId]) return state.assetCache[assetId];
    if (!state.cma) return undefined;
    try {
      const asset = await state.cma.asset.get({ assetId });
      set((s: AppStore) => ({
        assetCache: { ...s.assetCache, [assetId]: asset },
      }));
      return asset;
    } catch {
      return undefined;
    }
  },
  getEntryPreview: async (entryId: string) => {
    const state = get();
    if (state.entryCache[entryId]) return state.entryCache[entryId];
    if (!state.cma) return undefined;
    try {
      const entry = await state.cma.entry.get({ entryId });
      set((s: AppStore) => ({
        entryCache: { ...s.entryCache, [entryId]: entry },
      }));
      return entry;
    } catch {
      return undefined;
    }
  },

  selectAsset: async (
    ctId: string,
    fieldId: string,
    multiple: boolean = false
  ) => {
    const { sdk, contentTypes, setLinkValue } = get();
    if (!sdk) return;

    const ctDef = contentTypes.find((c: any) => c.sys.id === ctId);
    let opts: any = undefined;
    if (ctDef) {
      const fieldDef = ctDef.fields.find((f: any) => f.id === fieldId);
      const validations = fieldDef?.validations ?? [];
      const groups = validations
        .filter((v: any) => v.linkMimetypeGroup)
        .flatMap((v: any) => v.linkMimetypeGroup);
      if (groups.length > 0) {
        opts = { mimeTypeGroups: Array.from(new Set(groups)) };
      }
    }

    const picker = multiple
      ? sdk.dialogs.selectMultipleAssets
      : sdk.dialogs.selectSingleAsset;

    const result: any = await picker(opts);

    if (!result) return;

    let value: string | string[];
    if (multiple) {
      value = Array.isArray(result)
        ? result.map((a: any) => a.sys.id)
        : [result.sys.id];
    } else {
      value = Array.isArray(result) ? result[0]?.sys.id ?? "" : result.sys.id;
    }

    if (Array.isArray(value) ? value.length > 0 : value !== "") {
      setLinkValue(ctId, fieldId, "Asset", value);
    }
  },

  selectEntry: async (
    ctId: string,
    fieldId: string,
    multiple: boolean = false
  ) => {
    const { sdk, contentTypes, setLinkValue } = get();
    if (!sdk) return;

    const ctDef = contentTypes.find((c: any) => c.sys.id === ctId);
    let allowed: string[] | undefined = undefined;
    if (ctDef) {
      const fieldDef = ctDef.fields.find((f: any) => f.id === fieldId);
      if (fieldDef && Array.isArray(fieldDef.validations)) {
        const types = fieldDef.validations
          .filter((v: any) => v.linkContentType)
          .flatMap((v: any) => v.linkContentType);
        if (types.length > 0) allowed = Array.from(new Set(types));
      }
    }

    let opts: any = allowed ? { contentTypes: allowed } : undefined;

    const picker = multiple
      ? sdk.dialogs.selectMultipleEntries
      : sdk.dialogs.selectSingleEntry;

    const result: any = await picker(opts);

    if (!result) return;

    let value: string | string[];
    if (multiple) {
      value = Array.isArray(result)
        ? result.map((e: any) => e.sys.id)
        : [result.sys.id];
    } else {
      value = Array.isArray(result) ? result[0]?.sys.id ?? "" : result.sys.id;
    }

    if (Array.isArray(value) ? value.length > 0 : value !== "") {
      setLinkValue(ctId, fieldId, "Entry", value);
    }
  },

  bootstrap: async (sdk: ConfigAppSDK, cma: PlainClientAPI) => {
    get().setCma(cma);
    set({ sdk });

    const currentParameters: any = await sdk.app.getParameters();

    if (currentParameters) {
      const mapped: AppInstallationParameters = { contentTypes: {} };
      Object.entries(currentParameters.contentTypes ?? {}).forEach(
        ([ctId, ctExt]: any) => {
          const fieldMap: any = {};
          (ctExt.fields ?? []).forEach((f: any) => {
            const typeMap =
              f.fieldType === "AssetArray" || f.fieldType === "EntryArray"
                ? f.fieldType
                : f.linkType === "Asset"
                ? "Asset"
                : f.linkType === "Entry"
                ? "Entry"
                : f.fieldType;
            fieldMap[f.fieldId] = {
              fieldType: typeMap,
              defaultValue: f.defaultValue,
            };
          });
          mapped.contentTypes![ctId] = {
            enabled: true,
            fields: fieldMap,
          };
        }
      );
      set({ parameters: mapped });
    }

    try {
      const result = await cma.contentType.getMany({});
      set({ contentTypes: result.items });
    } catch (err) {
      /* eslint-disable no-console */
      console.error("Error fetching content types", err);
    } finally {
      set({ isLoadingCTs: false });
    }

    sdk.app.setReady();
  },

  getExternalParams: () => {
    const { parameters } = get();
    const externalParams: any = { contentTypes: {} };
    Object.entries(parameters.contentTypes ?? {}).forEach(
      ([ctId, ctCfg]: any) => {
        if (!ctCfg.enabled) return;
        const fieldsArr: any[] = Object.entries(ctCfg.fields).map(
          ([fieldId, fieldCfg]: any) => {
            const isAssetLink =
              fieldCfg.fieldType === "Asset" ||
              fieldCfg.fieldType === "AssetArray";
            const isEntryLink =
              fieldCfg.fieldType === "Entry" ||
              fieldCfg.fieldType === "EntryArray";

            const base: any = {
              fieldId,
              fieldType: fieldCfg.fieldType,
              defaultValue: fieldCfg.defaultValue,
            };

            if (isAssetLink) base.linkType = "Asset";
            if (isEntryLink) base.linkType = "Entry";
            return base;
          }
        );
        if (fieldsArr.length > 0)
          externalParams.contentTypes[ctId] = { fields: fieldsArr };
      }
    );
    return externalParams;
  },
}));
