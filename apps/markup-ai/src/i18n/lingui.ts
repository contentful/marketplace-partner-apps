import { i18n } from "@lingui/core";

// The Contentful field editors (@contentful/field-editor-*) translate their UI
// through the @lingui/core singleton, which is a peer dependency the host app
// must activate — components like CharCounter throw on render otherwise. Their
// messages are inlined in the components, so an empty catalog is enough: lingui
// falls back to the inline English text.
i18n.load("en", {});
i18n.activate("en");
