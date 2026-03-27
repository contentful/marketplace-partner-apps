import { describe, it, expect } from "vitest";
import {
  setContentTypeEnabled,
  toggleFieldSelection,
  setLinkValue,
  setJsonValue,
  setDateConfig,
} from "./parameterHelpers";
import { AppInstallationParameters } from "../types/config";

describe("parameterHelpers", () => {
  it("enables and disables content type via setContentTypeEnabled", () => {
    const initial: AppInstallationParameters = {};
    const enabled = setContentTypeEnabled(initial, "blog", true);
    expect(enabled.contentTypes?.blog.enabled).toBe(true);

    const disabled = setContentTypeEnabled(enabled, "blog", false);
    expect(disabled.contentTypes?.blog.enabled).toBe(false);
  });

  it("toggleFieldSelection adds and removes field config", () => {
    let params: AppInstallationParameters = {};
    params = toggleFieldSelection(params, "blog", "heroImage", "Asset");
    expect(params.contentTypes?.blog.fields.heroImage.fieldType).toBe("Asset");
    expect(params.contentTypes?.blog.enabled).toBe(false);

    params = toggleFieldSelection(params, "blog", "heroImage", "Asset");
    expect(params.contentTypes?.blog.fields.heroImage).toBeUndefined();
    expect(params.contentTypes?.blog.enabled).toBe(false);
  });

  it("setLinkValue infers types", () => {
    let params: AppInstallationParameters = {};
    params = setLinkValue(params, "blog", "hero", "Asset", "asset123");
    expect(params.contentTypes?.blog.fields.hero.fieldType).toBe("Asset");

    params = setLinkValue(params, "blog", "gallery", "Asset", ["a1", "a2"]);
    expect(params.contentTypes?.blog.fields.gallery.fieldType).toBe(
      "AssetArray"
    );

    params = setLinkValue(params, "blog", "author", "Entry", "e1");
    expect(params.contentTypes?.blog.fields.author.fieldType).toBe("Entry");
  });

  it("setJsonValue updates JSON value", () => {
    let params: AppInstallationParameters = {
      contentTypes: {
        blog: { enabled: true, fields: {} },
      },
    };
    params = setJsonValue(params, "blog", "settings", { dark: true });
    const fieldCfg = params.contentTypes?.blog.fields.settings;
    expect(fieldCfg?.fieldType).toBe("JSON");
    expect(fieldCfg?.defaultValue.value).toEqual({ dark: true });
  });

  it("setDateConfig sets date defaults", () => {
    let params: AppInstallationParameters = {
      contentTypes: {
        blog: { enabled: true, fields: {} },
      },
    };
    params = setDateConfig(params, "blog", "publishDate", {
      type: "current-date",
    });
    const fieldCfg = params.contentTypes?.blog.fields.publishDate;
    expect(fieldCfg?.fieldType).toBe("Date");
    expect(fieldCfg?.defaultValue.type).toBe("current-date");
  });
});
