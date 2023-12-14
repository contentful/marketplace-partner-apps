import React from 'react';
import PropTypes from 'prop-types';
import { FormLabel, CheckboxField } from '@contentful/forma-36-react-components';
import { SelectField, Option, TextField } from '@contentful/forma-36-react-components';
import { liltLocale } from './lilt';

export function parseForm(form, props) {
  const { liltApiUrl, liltApiKey } = props;
  const { contentfulApiKey, sdk } = props;
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;

  const { elements } = form;
  const formId = form.id;

  const formArgs = {
    projectPrefix: '',
    contentTypes: [],
    targetMemories: {}
  };

  for (const element of elements) {
    if (element.name === 'project_prefix') {
      formArgs.projectPrefix = element.value;
    }
    if (element.name.includes('content_type') && element.checked) {
      formArgs.contentTypes.push(element.value);
    }
    if (element.name.includes('target_memory') && element.value) {
      const nameParts = element.name.split('_');
      const memoryLocale = nameParts.pop();
      const locale = liltLocale(memoryLocale);
      const memoryId = Number(element.value);
      formArgs.targetMemories[locale] = { id: memoryId };
    }
  }

  const contentTypes = formArgs.contentTypes.join(',');
  const connector = {
    name: formArgs.projectPrefix,
    kind: 'contentful',
    schedule: '*/15 * * * *',
    args: {
      project_prefix: formArgs.projectPrefix,
      lilt_api_key: liltApiKey,
      lilt_api_url: liltApiUrl,
      contentful_management_token: contentfulApiKey,
      contentful_space_id: spaceId,
      contentful_environment_id: environmentId,
      contentful_content_type_id: contentTypes,
      contentful_link_depth: 1,
      target_memories: formArgs.targetMemories
    }
  };
  if (formId) {
    connector.id = Number(formId);
  }
  return connector;
}

export class ContentTypeCheckbox extends React.Component {
  constructor(props) {
    super(props);

    const { checked } = props;

    this.state = { checked };
    this.toggleChecked = this.toggleChecked.bind(this);
  }

  toggleChecked() {
    const { checked } = this.state;
    this.setState({ checked: !checked });
  }

  render() {
    const { checked } = this.state;
    const { item } = this.props;
    const fieldName = `content_type_${item.sys.id}`;

    return (
      <CheckboxField
        id={fieldName}
        labelText={item.name}
        name={fieldName}
        onClick={this.toggleChecked}
        value={item.sys.id}
        checked={checked}
      />
    );
  }
}

ContentTypeCheckbox.propTypes = {
  checked: PropTypes.bool,
  item: PropTypes.object
};

export function ContentTypeFields(props) {
  const { args, contentTypes } = props;

  let selectedContentTypes = [];
  if (args && args.contentful_content_type_id) {
    selectedContentTypes = args.contentful_content_type_id.split(',');
  }

  const contentTypeFields = contentTypes.map(item => {
    const checked = selectedContentTypes.includes(item.sys.id);
    const key = `${item.sys.id}_${checked}`;
    return <ContentTypeCheckbox key={key} item={item} checked={checked} />;
  });

  return (
    <section>
      <FormLabel htmlFor="content-types" required={true}>
        Content Types
      </FormLabel>
      <div key={args} className="content-types">
        {contentTypeFields}
      </div>
    </section>
  );
}

ContentTypeFields.propTypes = {
  args: PropTypes.object,
  contentTypes: PropTypes.array
};

export function MemorySelect(props) {
  const { locale, targetMemories, selected } = props;
  const fieldName = `target_memory_${locale}`;
  const fieldLabel = `${locale}`;

  const memoryOptions = targetMemories.map(item => {
    return (
      <Option key={item.id} value={`${item.id}`}>
        {item.id} - {item.name}
      </Option>
    );
  });

  return (
    <SelectField id={fieldName} name={fieldName} labelText={fieldLabel} value={`${selected}`}>
      <Option value="">-- Select a Memory --</Option>
      {memoryOptions}
    </SelectField>
  );
}

MemorySelect.propTypes = {
  locale: PropTypes.string,
  targetMemories: PropTypes.array,
  selected: PropTypes.number
};

export function LocaleFields(props) {
  const { args, memories, sdk } = props;
  const defaultLocale = sdk.locales.default;
  const availableLocales = sdk.locales.available;

  const memoryMap = {};
  for (const memory of memories) {
    const { trglang } = memory;
    if (!memoryMap[trglang]) {
      memoryMap[trglang] = [];
    }
    memoryMap[trglang].push(memory);
  }

  let selectedTargetMemories = {};
  if (args && args.target_memories) {
    selectedTargetMemories = args.target_memories;
  }

  const locales = availableLocales.filter(locale => locale !== defaultLocale);
  const localeFields = locales.map(locale => {
    const targetLocale = liltLocale(locale);
    const selectedMemory = selectedTargetMemories[targetLocale];
    const lang = targetLocale.substring(0, 2);
    let targetMemories = memoryMap[lang];
    if (!targetMemories) {
      targetMemories = [];
    }

    let selected = undefined;
    if (selectedMemory) {
      selected = selectedMemory.id;
    }

    return (
      <MemorySelect
        key={`memory_${locale}_${selected}`}
        locale={locale}
        targetMemories={targetMemories}
        selected={selected}
      />
    );
  });

  return (
    <section>
      <FormLabel htmlFor="memory-selection" required={true}>
        Memory Selection
      </FormLabel>
      <div key={args}>{localeFields}</div>
    </section>
  );
}

LocaleFields.propTypes = {
  args: PropTypes.object,
  memories: PropTypes.array,
  sdk: PropTypes.object
};

export function ConfigName(props) {
  const { args } = props;

  let projectPrefix = '';
  if (args && args.project_prefix) {
    projectPrefix = args.project_prefix;
  }

  return (
    <TextField
      id="config_form_project_prefix"
      name="project_prefix"
      labelText="Configuration Name"
      value={projectPrefix}
      required
    />
  );
}

ConfigName.propTypes = {
  args: PropTypes.object
};
