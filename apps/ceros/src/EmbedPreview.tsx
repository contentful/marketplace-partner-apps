import { Box, Note, Paragraph } from '@contentful/f36-components'
import tokens from '@contentful/f36-tokens'
import React, { useEffect, useRef, useState } from 'react'

import { classifyEmbed } from './embed-classify'
import styles from './styles'

const INLINE_PREVIEW_DEFAULT_HEIGHT = 600

// Renders an inline Flex embed inside a srcDoc iframe so its flex-client script
// executes in an isolated document: it never touches the Contentful app's DOM or
// globals, and teardown is just discarding the iframe — which is also what keeps
// a React re-mount from double-initializing the embed. The srcDoc document is
// same-origin, so we can measure its content to auto-size the preview and to
// detect whether the experience actually rendered.
function InlinePreview({ embedCode }: { embedCode: string }) {
    const [height, setHeight] = useState(INLINE_PREVIEW_DEFAULT_HEIGHT)
    const [failed, setFailed] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        setFailed(false)
        let settled = false
        const measure = (): number => {
            const doc = iframeRef.current?.contentDocument
            if (!doc || !doc.body) return 0
            return Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
        }
        // flex-client renders asynchronously after load, so poll for content
        // growth over a short window rather than measuring a single time.
        const interval = setInterval(() => {
            const h = measure()
            if (h > 40) {
                setHeight(h)
                settled = true
            }
        }, 500)
        const timeout = setTimeout(() => {
            clearInterval(interval)
            if (!settled) setFailed(true)
        }, 6000)
        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [embedCode])

    return (
        <>
            <iframe
                ref={iframeRef}
                title="Ceros inline experience preview"
                srcDoc={embedCode}
                style={{ width: '100%', height, border: 'none' }}
            />
            <Paragraph>
                <small style={{ color: tokens.gray600 }}>
                    This is an editor preview — the inline experience will size itself correctly on your published site.
                </small>
            </Paragraph>
            {failed && (
                <Box marginTop="spacingS">
                    <Note variant="warning">
                        The inline preview couldn't be shown here, but the experience will still render on your published site.
                    </Note>
                </Box>
            )}
        </>
    )
}

function IframePreview({ embedCode }: { embedCode: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container || !embedCode) return
        container.innerHTML = ''
        container.appendChild(document.createRange().createContextualFragment(embedCode))
    }, [embedCode])

    return <div className={styles.experienceEmbed} ref={containerRef}></div>
}

// Renders a stored embed code in whichever way that code requires.
export function EmbedPreview({ embedCode }: { embedCode: string }) {
    const kind = classifyEmbed(embedCode)
    if (kind === 'inline') return <InlinePreview embedCode={embedCode} />
    if (kind === 'iframe') return <IframePreview embedCode={embedCode} />
    return null
}
