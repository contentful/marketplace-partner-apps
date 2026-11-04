// @vitest-environment jsdom
import { test, expect, describe } from 'vitest';
import { render } from '@testing-library/react';
import { getVideoPlayerSrc, getVideoAspectRatio } from '../src/utils/VideoPlayer';
import { VideoEmbed } from '../src/components/VideoEmbed';

describe('getVideoPlayerSrc', () => {
    test('returns the src of a Mediaflow player iframe', () => {
        expect(getVideoPlayerSrc('<iframe src="https://play.mediaflow.com/ovp/11/ABC123" width="640" height="360"></iframe>'))
            .toBe('https://play.mediaflow.com/ovp/11/ABC123');
    });

    test('resolves a protocol relative src to https', () => {
        expect(getVideoPlayerSrc('<iframe src="//play.mediaflow.com/ovp/11/ABC123"></iframe>'))
            .toBe('https://play.mediaflow.com/ovp/11/ABC123');
    });

    test.each([
        ['empty', ''],
        ['undefined', undefined],
        ['no iframe', '<div>video</div>'],
        ['iframe without src', '<iframe></iframe>'],
        ['other origin', '<iframe src="https://evil.example/ovp/1"></iframe>'],
        ['look-alike host', '<iframe src="https://play.mediaflow.com.evil.example/x"></iframe>'],
        ['userinfo trick', '<iframe src="https://play.mediaflow.com@evil.example/x"></iframe>'],
        ['http', '<iframe src="http://play.mediaflow.com/x"></iframe>'],
        ['javascript url', '<iframe src="javascript:alert(1)"></iframe>'],
        ['data url', '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'],
        ['script only', '<script>alert(1)</script>'],
    ])('rejects %s', (_name, embedCode) => {
        expect(getVideoPlayerSrc(embedCode)).toBeNull();
    });

    test('does not execute scripts in the embed code', () => {
        const w = window as unknown as { pwned?: boolean };
        getVideoPlayerSrc('<img src=x onerror="window.pwned=true"><script>window.pwned=true</script><iframe src="https://play.mediaflow.com/a"></iframe>');
        expect(w.pwned).toBeUndefined();
    });
});

describe('getVideoAspectRatio', () => {
    test('uses the video dimensions', () => {
        expect(getVideoAspectRatio(1080, '1920')).toBe('1080 / 1920');
    });
    test('falls back to 16 / 9', () => {
        expect(getVideoAspectRatio(undefined, 0)).toBe('16 / 9');
    });
});

describe('VideoEmbed', () => {
    test('renders a sandboxed iframe for the player', () => {
        const { container } = render(<VideoEmbed playerSrc="https://play.mediaflow.com/ovp/11/ABC123" aspectRatio="16 / 9" maxWidth={ 300 } />);
        const iframe = container.querySelector('iframe');
        expect(iframe?.getAttribute('src')).toBe('https://play.mediaflow.com/ovp/11/ABC123');
        expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-presentation');
        expect(container.querySelector('script')).toBeNull();
    });

    test('renders nothing without a player URL', () => {
        const { container } = render(<VideoEmbed playerSrc={ null } aspectRatio="16 / 9" />);
        expect(container.innerHTML).toBe('');
    });
});
