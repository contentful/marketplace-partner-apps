/// <reference types="cypress" />
import { getValueByKeyCaseInsensitive } from './tools'

describe('Tools utilities', () => {
  it('should get value by key case insensitive', () => {
    const testObject = {
      'CoreField.Title': 'Test Title',
      'CoreField.Description': 'Test Description',
      'system.id': '123456',
      'system.createdAt': '2023-01-01T00:00:00Z'
    }

    // Test basic functionality with string values
    const title = getValueByKeyCaseInsensitive('CoreField.Title', testObject, 'default')
    expect(title).to.equal('Test Title')

    // Test case insensitivity
    const description = getValueByKeyCaseInsensitive('COREFIELD.DESCRIPTION', testObject, 'default')
    expect(description).to.equal('Test Description')

    // Test with default value when key not found
    const missing = getValueByKeyCaseInsensitive('Missing.Key', testObject, 'default value')
    expect(missing).to.equal('default value')

    // Test with empty key
    const emptyKey = getValueByKeyCaseInsensitive('', testObject, 'empty key default')
    expect(emptyKey).to.equal('empty key default')

    // Test with empty object
    const emptyObject = {}
    const result = getValueByKeyCaseInsensitive('Any.Key', emptyObject, 'empty default')
    expect(result).to.equal('empty default')

    // Test with nested-style keys
    const complexObject = {
      'document.metadata.author': 'John Doe',
      'document.metadata.created': '2023-01-01',
      'settings.theme.color': 'blue'
    }

    const author = getValueByKeyCaseInsensitive('DOCUMENT.METADATA.AUTHOR', complexObject, 'Unknown')
    expect(author).to.equal('John Doe')

    const created = getValueByKeyCaseInsensitive('document.metadata.created', complexObject, 'Unknown')
    expect(created).to.equal('2023-01-01')

    const color = getValueByKeyCaseInsensitive('settings.theme.color', complexObject, 'Unknown')
    expect(color).to.equal('blue')

    // Test with configuration values
    const configObject = {
      'Config.IsEnabled': 'true',
      'Config.MaxSize': '1024',
      'Config.Ratio': '3.14',
      'Config.IsDisabled': 'false'
    }

    const enabled = getValueByKeyCaseInsensitive('config.isenabled', configObject, 'false')
    expect(enabled).to.equal('true')

    const maxSize = getValueByKeyCaseInsensitive('CONFIG.MAXSIZE', configObject, '0')
    expect(maxSize).to.equal('1024')

    const ratio = getValueByKeyCaseInsensitive('config.ratio', configObject, '0.0')
    expect(ratio).to.equal('3.14')

    const disabled = getValueByKeyCaseInsensitive('config.isdisabled', configObject, 'true')
    expect(disabled).to.equal('false')
  })

  // Execution tests for better coverage
  describe('getValueByKeyCaseInsensitive function execution', () => {
    it('should execute and return correct values for case insensitive lookup', () => {
      const testObject = {
        'Content-Type': 'application/json',
        'Content-Length': '1024',
        'Authorization': 'Bearer token123',
        'User-Agent': 'TestAgent/1.0'
      };

      // Execute the actual function with various cases
      const result1 = getValueByKeyCaseInsensitive('content-type', testObject, 'default');
      const result2 = getValueByKeyCaseInsensitive('CONTENT-TYPE', testObject, 'default');
      const result3 = getValueByKeyCaseInsensitive('Content-Type', testObject, 'default');
      const result4 = getValueByKeyCaseInsensitive('content-length', testObject, 'default');

      // Validate execution results
      expect(result1).to.equal('application/json');
      expect(result2).to.equal('application/json');
      expect(result3).to.equal('application/json');
      expect(result4).to.equal('1024');

      // Test default value functionality
      const notFoundResult = getValueByKeyCaseInsensitive('non-existent', testObject, 'default-value');
      expect(notFoundResult).to.equal('default-value');
    });

    it('should handle edge cases correctly', () => {
      // Execute with null/undefined objects (cast to bypass TypeScript checks for testing)
      const nullResult = getValueByKeyCaseInsensitive('any-key', null as any, 'default');
      const undefinedResult = getValueByKeyCaseInsensitive('any-key', undefined as any, 'default');
      const emptyResult = getValueByKeyCaseInsensitive('any-key', {}, 'default');

      expect(nullResult).to.equal('default');
      expect(undefinedResult).to.equal('default');
      expect(emptyResult).to.equal('default');

      // Execute with empty key
      const emptyKeyResult = getValueByKeyCaseInsensitive('', { 'test': 'value' }, 'default');
      expect(emptyKeyResult).to.equal('default');
    });

    it('should execute complex object lookups', () => {
      const complexObject = {
        'System.Id': 'sys-123',
        'System.CreatedAt': '2023-01-01',
        'CoreField.Title': 'Test Document',
        'CoreField.Description': 'Test Description',
        'Metadata.Author': 'John Doe',
        'Metadata.Tags': 'test,document,sample'
      };

      // Execute multiple lookups
      const id = getValueByKeyCaseInsensitive('system.id', complexObject, '');
      const title = getValueByKeyCaseInsensitive('COREFIELD.TITLE', complexObject, '');
      const author = getValueByKeyCaseInsensitive('metadata.author', complexObject, '');
      const tags = getValueByKeyCaseInsensitive('METADATA.TAGS', complexObject, '');

      expect(id).to.equal('sys-123');
      expect(title).to.equal('Test Document');
      expect(author).to.equal('John Doe');
      expect(tags).to.equal('test,document,sample');
    });
  });
})
