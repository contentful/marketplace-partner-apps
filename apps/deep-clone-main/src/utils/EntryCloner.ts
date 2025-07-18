import { ContentTypeProps, CreateEntryProps, EntryProps } from 'contentful-management';
import { CMAClient } from '@contentful/app-sdk';
import { AppParameters } from '@/vite-env';

type ReferenceMap = {
  [entryId: string]: EntryProps;
};

class EntryCloner {
  private references: ReferenceMap = {};
  private clones: ReferenceMap = {};
  private contentTypes: { [id: string]: ContentTypeProps } = {};
  private parameters: AppParameters;
  private cma: CMAClient;

  constructor(cma: CMAClient, parameters: AppParameters) {
    this.cma = cma;
    this.parameters = parameters;
  }

  async cloneEntry(entryId: string): Promise<EntryProps> {
    this.references = {};
    this.clones = {};
    await this.findReferences(entryId);
    await this.createClones();
    await this.updateReferenceTree();
    return this.clones[entryId] as EntryProps;
  }

  private async findReferences(entryId: string): Promise<void> {
    if (this.references[entryId]) {
      return;
    }

    const entry = await this.cma.entry.get({ entryId: entryId });
    // TODO: error handling

    if (entry !== undefined) {
      this.references[entryId] = entry;

      for (const fieldName in entry.fields) {
        const field = entry.fields[fieldName];

        for (const locale in field) {
          const fieldValue = field[locale];
          await this.inspectField(fieldValue);
        }
      }
    }
  }

  private async createClones(): Promise<ReferenceMap> {
    for (const entryId in this.references) {
      const entry = this.references[entryId];

      if (!entry) continue;

      const entryFields = await this.getFieldsForClone(entry);
      const createProps: CreateEntryProps = {
        fields: entryFields,
        ...(entry.metadata ? { metadata: entry.metadata } : {}),
      };

      const clone = await this.cma.entry.create({ contentTypeId: entry.sys.contentType.sys.id }, createProps);

      this.clones[entryId] = clone;
    }

    return this.clones;
  }

  private async updateReferenceTree(): Promise<void> {
    for (const clone of Object.values(this.clones)) {
      let cloneWasUpdated = false;
      for (const fieldId in clone.fields) {
        const field = clone.fields[fieldId];

        for (const locale in field) {
          const fieldValue = field[locale];
          const fieldWasUpdated = await this.updateReferencesOnField(fieldValue);
          cloneWasUpdated ||= fieldWasUpdated;
        }
      }

      if (cloneWasUpdated) {
        await this.cma.entry.update(
          { entryId: clone.sys.id },
          {
            sys: { ...clone.sys, version: clone.sys.version },
            fields: clone.fields,
          }
        );
      }
    }
  }

  private async inspectField(fieldValue: any): Promise<void> {
    if (!fieldValue) return;

    if (this.isReferenceArray(fieldValue)) {
      await Promise.all(
        fieldValue.map(async (f: any) => {
          return await this.inspectField(f);
        })
      );
      return;
    }

    if (this.isReference(fieldValue)) {
      await this.findReferences(fieldValue.sys.id);
    }
  }

  private async updateReferencesOnField(fieldValue: any): Promise<boolean> {
    if (!fieldValue) return false;

    if (this.isReferenceArray(fieldValue)) {
      const didUpdateArray = await Promise.all(
        fieldValue.map(async (f: any) => {
          return await this.updateReferencesOnField(f);
        })
      );
      return didUpdateArray.some((didUpdate) => didUpdate);
    }

    if (this.isReference(fieldValue)) {
      const clone = this.clones[fieldValue.sys.id];
      if (clone !== undefined) {
        fieldValue.sys.id = clone.sys.id;
        return true;
      }
    }

    return false;
  }

  private async getFieldsForClone(entry: EntryProps): Promise<any> {
    // Create a deep copy of the entry fields to avoid modifying the original
    const entryFields = JSON.parse(JSON.stringify(entry.fields));

    const contentType =
      this.contentTypes[entry.sys.contentType.sys.id] ||
      (await this.cma.contentType.get({
        contentTypeId: entry.sys.contentType.sys.id,
      }));
    this.contentTypes[entry.sys.contentType.sys.id] = contentType;

    const titleField = contentType.fields.find((field) => field.id === contentType.displayField);

    // Update title field for the clone
    if (titleField && entryFields[titleField.id]) {
      for (const locale in entryFields[titleField.id]) {
        if (entryFields[titleField.id][locale]) {
          const title = entryFields[titleField.id][locale];
          entryFields[titleField.id][locale] = this.parameters.cloneTextBefore
            ? `${this.parameters.cloneText} ${title}`
            : `${title} ${this.parameters.cloneText}`;
        }
      }
    }

    return entryFields;
  }

  private isReferenceArray(fieldValue: any): boolean {
    return Array.isArray(fieldValue) && fieldValue.some((f: any) => this.isReference(f));
  }

  private isReference(fieldValue: any): boolean {
    return fieldValue.sys && fieldValue.sys.type === 'Link' && fieldValue.sys.linkType === 'Entry';
  }
}

export default EntryCloner;
