import { describe, test, expect } from 'vitest';
import type { AppState } from '@contentful/app-sdk';
import {
    assignmentsFromState,
    buildTargetState,
    DEFAULT_SIDEBAR_POSITION,
    missingCredentials,
    summarizeContentTypes,
    toggleAssignment,
} from '../src/utils/ContentTypeAssignment';
import type { Assignments } from '../src/utils/ContentTypeAssignment';

/**
 * Tests the content type assignment and credential checks of the configuration screen
 */
describe('summarizeContentTypes', () => {
    test('keeps only content types with JSON object fields, sorted by name', () => {
        const result = summarizeContentTypes([
            { sys: { id: 'page' }, name: 'Page', fields: [{ id: 'title', name: 'Title', type: 'Symbol' }, { id: 'hero', name: 'Hero image', type: 'Object' }] },
            { sys: { id: 'author' }, name: 'Author', fields: [{ id: 'name', name: 'Name', type: 'Symbol' }] },
            { sys: { id: 'article' }, name: 'Article', fields: [{ id: 'image', name: 'Image', type: 'Object' }, { id: 'gallery', name: 'Gallery', type: 'Object' }] },
        ]);
        expect(result).toEqual([
            { id: 'article', name: 'Article', jsonFields: [{ id: 'image', name: 'Image' }, { id: 'gallery', name: 'Gallery' }] },
            { id: 'page', name: 'Page', jsonFields: [{ id: 'hero', name: 'Hero image' }] },
        ]);
    });
});

describe('assignmentsFromState', () => {
    test('is empty before the app is installed', () => {
        expect(assignmentsFromState(null)).toEqual({});
    });

    test('reads fields and sidebar per content type', () => {
        const state: AppState = { EditorInterface: {
            article: { controls: [{ fieldId: 'image' }], sidebar: { position: 3 } },
            page: { controls: [{ fieldId: 'hero' }] },
            news: { sidebar: { position: 1 } },
        } };
        expect(assignmentsFromState(state)).toEqual({
            article: { fields: ['image'], sidebar: true },
            page: { fields: ['hero'], sidebar: false },
            news: { fields: [], sidebar: true },
        });
    });

    test('keeps content types that only have an entry editor assignment', () => {
        const state: AppState = { EditorInterface: { article: { editors: { position: 0 } } } };
        expect(assignmentsFromState(state)).toEqual({ article: { fields: [], sidebar: false } });
    });

    test('stores content type ids that match Object.prototype properties as own entries', () => {
        const editorInterface: AppState['EditorInterface'] = JSON.parse('{"__proto__": {"sidebar": {"position": 1}}}');
        const assignments = assignmentsFromState({ EditorInterface: editorInterface });
        expect(Object.keys(assignments)).toEqual(['__proto__']);
        expect(assignments['__proto__']).toEqual({ fields: [], sidebar: true });
        expect(assignments['toString']).toBeUndefined();
    });
});

describe('buildTargetState', () => {
    test('adds controls and a sidebar at the default position', () => {
        expect(buildTargetState({ article: { fields: ['image'], sidebar: true } }, null)).toEqual({
            EditorInterface: { article: { controls: [{ fieldId: 'image' }], sidebar: { position: DEFAULT_SIDEBAR_POSITION } } },
        });
    });

    test('leaves out content types with nothing selected, which removes the app from them', () => {
        const current: AppState = { EditorInterface: { article: { controls: [{ fieldId: 'image' }] } } };
        expect(buildTargetState({ article: { fields: [], sidebar: false } }, current)).toEqual({ EditorInterface: {} });
    });

    test('keeps the sidebar position and control settings already set', () => {
        const current: AppState = { EditorInterface: {
            article: { controls: [{ fieldId: 'image', settings: { helpText: 'Pick a photo' } }], sidebar: { position: 4 } },
        } };
        expect(buildTargetState({ article: { fields: ['image', 'gallery'], sidebar: true } }, current)).toEqual({
            EditorInterface: { article: {
                controls: [{ fieldId: 'image', settings: { helpText: 'Pick a photo' } }, { fieldId: 'gallery' }],
                sidebar: { position: 4 },
            } },
        });
    });

    test('keeps an existing entry editor assignment on retained content types', () => {
        const current: AppState = { EditorInterface: {
            article: { controls: [{ fieldId: 'image' }], editors: { position: 2, settings: { mode: 'compact' } } },
        } };
        expect(buildTargetState({ article: { fields: ['image'], sidebar: true } }, current)).toEqual({
            EditorInterface: { article: {
                controls: [{ fieldId: 'image' }],
                sidebar: { position: DEFAULT_SIDEBAR_POSITION },
                editors: { position: 2, settings: { mode: 'compact' } },
            } },
        });
    });

    test('keeps the entry editor assignment when no fields or sidebar are selected', () => {
        const current: AppState = { EditorInterface: {
            article: { controls: [{ fieldId: 'image' }], sidebar: { position: 2 }, editors: { position: 1 } },
        } };
        expect(buildTargetState({ article: { fields: [], sidebar: false } }, current)).toEqual({
            EditorInterface: { article: { editors: { position: 1 } } },
        });
    });

    test('stores a content type id of __proto__ as an own entry', () => {
        const assignments: Assignments = JSON.parse('{"__proto__": {"fields": [], "sidebar": true}}');
        const editorInterface = buildTargetState(assignments, null).EditorInterface;
        expect(Object.keys(editorInterface)).toEqual(['__proto__']);
        expect(editorInterface['__proto__']).toEqual({ sidebar: { position: DEFAULT_SIDEBAR_POSITION } });
        expect(JSON.parse(JSON.stringify(editorInterface))).toEqual(JSON.parse('{"__proto__": {"sidebar": {"position": 1}}}'));
    });

    test('round-trips the current state unchanged', () => {
        const current: AppState = { EditorInterface: {
            article: { controls: [{ fieldId: 'image' }], sidebar: { position: 2 } },
            page: { controls: [{ fieldId: 'hero' }] },
            news: { editors: { position: 0 } },
        } };
        expect(buildTargetState(assignmentsFromState(current), current)).toEqual(current);
    });
});

describe('toggleAssignment', () => {
    test('adds and removes fields without changing the input', () => {
        const before = { article: { fields: ['image'], sidebar: false } };
        const added = toggleAssignment(before, 'article', { fieldId: 'gallery' }, true);
        expect(added.article.fields).toEqual(['image', 'gallery']);
        expect(before.article.fields).toEqual(['image']);
        expect(toggleAssignment(added, 'article', { fieldId: 'image' }, false).article.fields).toEqual(['gallery']);
    });

    test('does not add a field twice', () => {
        const result = toggleAssignment({ article: { fields: ['image'], sidebar: false } }, 'article', { fieldId: 'image' }, true);
        expect(result.article.fields).toEqual(['image']);
    });

    test('turns the sidebar on for a content type that had nothing assigned', () => {
        expect(toggleAssignment({}, 'page', 'sidebar', true)).toEqual({ page: { fields: [], sidebar: true } });
    });

    test('treats content type ids that match Object.prototype properties as own entries', () => {
        const once = toggleAssignment({}, 'toString', { fieldId: 'image' }, true);
        expect(Object.keys(once)).toEqual(['toString']);
        expect(once['toString']).toEqual({ fields: ['image'], sidebar: false });
        const twice = toggleAssignment(once, 'constructor', 'sidebar', true);
        expect(twice['constructor']).toEqual({ fields: [], sidebar: true });
        expect(twice['hasOwnProperty']).toBeUndefined();
        const proto = toggleAssignment(twice, '__proto__', 'sidebar', true);
        expect(Object.keys(proto)).toEqual(['toString', 'constructor', '__proto__']);
        expect(proto['__proto__']).toEqual({ fields: [], sidebar: true });
    });
});

describe('missingCredentials', () => {
    test('lists empty and whitespace-only credentials', () => {
        expect(missingCredentials({ clientId: 'abc', clientSecret: '  ' })).toEqual(['Client secret', 'Refresh token']);
    });

    test('is empty when all credentials are set', () => {
        expect(missingCredentials({ clientId: 'abc', clientSecret: 'def', refreshToken: 'ghi' })).toEqual([]);
    });
});
