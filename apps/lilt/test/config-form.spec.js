import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ConfigName, LocaleFields, MemorySelect } from '../src/config-form';
import { ContentTypeFields, ContentTypeCheckbox } from '../src/config-form';
import { parseForm } from '../src/config-form';
import { mockSdk } from './mock-sdk';

describe('ConfigName', () => {
  afterEach(cleanup);

  it('renders "Configuration Name" label text', () => {
    const { getByText } = render(<ConfigName />);
    expect(getByText('Configuration Name')).toBeInTheDocument();
  });

  it('renders project_prefix value', () => {
    const { container } = render(<ConfigName args={{ project_prefix: 'testing' }} />);
    const configInput = container.querySelector('input');
    expect(configInput.value).toBe('testing');
  });
});

describe('LocaleFields', () => {
  afterEach(cleanup);

  it('renders "Memory Selection" label text', () => {
    const sdk = mockSdk();
    sdk.locales.available = [];
    const { getByText } = render(<LocaleFields sdk={sdk} memories={[]} />);
    expect(getByText('Memory Selection')).toBeInTheDocument();
  });

  it('renders select elements', () => {
    const sdk = mockSdk();
    const memories = [{ id: 123, trglocale: 'de' }, { id: 124, trglocale: 'es' }];
    const selectedMemories = { de: { id: 123 } };
    const args = { target_memories: selectedMemories };
    const { container } = render(<LocaleFields sdk={sdk} memories={memories} args={args} />);
    const selectElements = container.querySelectorAll('select');
    expect(selectElements).toHaveLength(2);
  });
});

describe('MemorySelect', () => {
  afterEach(cleanup);

  it('renders locale label text', () => {
    const { getByText } = render(<MemorySelect locale="es" targetMemories={[]} />);
    expect(getByText('es')).toBeInTheDocument();
  });

  it('renders memory options', () => {
    const targetMemories = [{ id: 123, name: 'test memory 1' }, { id: 124, name: 'test memory 2' }];
    const { container } = render(
      <MemorySelect locale="es" targetMemories={targetMemories} selected={124} />
    );
    const selectElement = container.querySelector('select');
    const options = container.querySelectorAll('option');
    expect(selectElement.value).toBe('124');
    expect(options).toHaveLength(3);
  });
});

describe('ContentTypeFields', () => {
  afterEach(cleanup);

  it('renders label text', () => {
    const { getByText } = render(<ContentTypeFields contentTypes={[]} />);
    expect(getByText('Content Types')).toBeInTheDocument();
  });

  it('renders content type options', () => {
    const args = { contentful_content_type_id: 'testType,testType2' };
    const contentTypes = [
      { name: 'test type', sys: { id: 'testType' } },
      { name: 'test type 2', sys: { id: 'testType2' } }
    ];
    const { container } = render(<ContentTypeFields args={args} contentTypes={contentTypes} />);
    const inputElements = container.querySelectorAll('input');
    expect(inputElements).toHaveLength(2);
    for (const element of inputElements) {
      expect(element.checked).toBe(true);
    }
  });
});

describe('ContentTypeCheckbox', () => {
  afterEach(cleanup);

  const contentType = { name: 'test type', sys: { id: 'testType' } };

  it('renders label text', () => {
    const { getByText } = render(<ContentTypeCheckbox item={contentType} checked={false} />);
    expect(getByText('test type')).toBeInTheDocument();
  });

  it('renders checked input field', () => {
    const { container } = render(<ContentTypeCheckbox item={contentType} checked={true} />);
    const inputElement = container.querySelector('input');
    expect(inputElement.checked).toBe(true);
  });
});

function makeMockForm() {
  return {
    elements: [
      { name: 'project_prefix', value: 'testConnector' },
      { name: 'content_type_blog', checked: true, value: 'blog' },
      { name: 'content_type_author', checked: true, value: 'author' },
      { name: 'content_type_image', checked: false, value: 'image' },
      { name: 'target_memory_es', value: '1233' },
      { name: 'target_memory_fr-FR', value: '1234' },
      { name: 'target_memory_nb-NO', value: '1235' },
      { name: 'target_memory_zh-Hans', value: '1236' },
      { name: 'target_memory_zh-Hant', value: '1237' }
    ]
  };
}

function makeMockProps() {
  return {
    liltApiUrl: 'https://dev.lilt.com/2',
    liltApiKey: 'apikey',
    contentfulApiKey: 'apikey',
    sdk: mockSdk()
  };
}

describe('parseForm', () => {
  const mockForm = makeMockForm();
  const mockProps = makeMockProps();
  const connector = parseForm(mockForm, mockProps);

  it('renders name', () => {
    expect(connector.name).toBe('testConnector');
  });

  it('renders kind', () => {
    expect(connector.kind).toBe('contentful');
  });

  it('renders schedule', () => {
    expect(connector.schedule).toBe('*/15 * * * *');
  });

  it('renders contentful_content_type_id', () => {
    expect(connector.args.contentful_content_type_id).toBe('blog,author');
  });

  it('renders target_memory with no locale', () => {
    expect(connector.args.target_memories.es.id).toBe(1233);
  });

  it('renders target_memory with locale', () => {
    expect(connector.args.target_memories['fr-FR'].id).toBe(1234);
  });

  it('renders nb-NO target_memory as no-NO', () => {
    expect(connector.args.target_memories['no-NO'].id).toBe(1235);
  });

  it('renders zh-Hans target_memory as zh-CN', () => {
    expect(connector.args.target_memories['zh-CN'].id).toBe(1236);
  });

  it('renders zh-Hant target_memory as zt', () => {
    expect(connector.args.target_memories.zt.id).toBe(1237);
  });
});
