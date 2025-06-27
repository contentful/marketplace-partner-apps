import { describe, it, expect } from "vitest";

import {
  linkTaxonomyManager,
  linkTaxonomyConceptSchema,
  linkTaxonomyConcept,
  linkTaxonomyContent,
} from "../taxonomyDeepLinks";

describe("taxonomyDeepLinks", () => {
  const ORG = "org123";
  const SPACE = "spaceABC";
  const ENV = "master";
  const SCHEMA = "scheme1";
  const CONCEPT = "concept99";

  it("generates manager URL", () => {
    expect(linkTaxonomyManager(ORG)).toBe(
      `https://app.contentful.com/account/organizations/${ORG}/taxonomy/concept-schemes`
    );
  });

  it("generates concept schema URL", () => {
    expect(linkTaxonomyConceptSchema(ORG, SCHEMA)).toBe(
      `https://app.contentful.com/account/organizations/${ORG}/taxonomy/concept-schemes/${SCHEMA}/hierarchy`
    );
  });

  it("generates concept URL", () => {
    expect(linkTaxonomyConcept(ORG, CONCEPT)).toBe(
      `https://app.contentful.com/account/organizations/${ORG}/taxonomy/concepts/${CONCEPT}`
    );
  });

  it("generates content URL", () => {
    expect(linkTaxonomyContent(SPACE, ENV, CONCEPT)).toBe(
      `https://app.contentful.com/spaces/${SPACE}/environments/${ENV}/views/entries?order.direction=descending&order.fieldId=updatedAt&filters.0.key=metadata.concepts.sys.id&filters.0.op=descendants&filters.0.val=${CONCEPT}`
    );
  });
});
