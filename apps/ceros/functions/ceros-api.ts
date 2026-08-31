// Contentful Function handler for the Ceros API experience chooser.
// Invoked via the CerosApi App Action (type: function-invocation).
// The API key is read from context.appInstallationParameters and never
// exposed to the browser.

// Inline types matching @contentful/node-apps-toolkit's shapes.
type InstallationParams = { cerosApiKey?: string }

type AppActionEvent = {
  type: 'appaction.call'
  body: Record<string, unknown>
  headers: Record<string, string | number>
}

type FunctionContext = {
  spaceId: string
  environmentId: string
  appInstallationParameters: InstallationParams
  cmaClientOptions?: unknown
}

export interface FolderNode {
  resourceId: string
  name: string
  isFlexFolder: boolean
  children: FolderNode[]
}

export interface ExperienceNode {
  resourceId: string
  name: string
  thumbnailUrl?: string
  isFlexExperience: boolean
}

export interface Paging {
  total: number
  page: number
  pages: number
  pageSize: number
  next?: string
  previous?: string
}

// Allowed query keys per action. Anything else in the JSON `query` is dropped
// before forwarding, so the picker can pass query params freely without the
// function becoming an open proxy.
const QUERY_WHITELIST: Record<string, string[]> = {
  getFolderTree: ['folder', 'depth'],
  getFolderExperiences: ['page', 'search', 'sort'],
}

// Parses the JSON `query` field off the app-action body and returns a
// URLSearchParams containing only the whitelisted keys for `action`.
function parseQuery(action: string, rawQuery: unknown): URLSearchParams {
  const params = new URLSearchParams()
  const allowed = QUERY_WHITELIST[action] ?? []
  if (typeof rawQuery !== 'string' || rawQuery.length === 0) return params
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawQuery)
  } catch {
    return params
  }
  for (const key of allowed) {
    const value = parsed[key]
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params
}

// ── API helpers ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://rest.ceros.com'
const API_VERSION = '2026-08-06-09-00'

function makeHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'X-Ceros-Api-Version': API_VERSION,
    'X-Ceros-Plugin': 'contentful',
  }
}

async function cerosGet(
  path: string,
  apiKey: string
): Promise<any> {
  const response = await fetch(`${BASE_URL}${path}`, { headers: makeHeaders(apiKey) })
  if (!response.ok) {
    if (response.status === 401) {
      return { _error: 'Ceros API key is invalid. Check it in the app configuration.' }
    }
    if (response.status === 403) {
      return { _error: 'There is a problem with your Ceros API key. Check it in the app configuration.' }
    }
    const text = await response.text()
    return { _error: `Ceros API error (${response.status}): ${text}` }
  }
  return response.json()
}

// ── Paste resolution ─────────────────────────────────────────────────────────

const INVALID_URL_ERROR =
  "The experience URL is invalid. Make sure it looks like 'https://account.ceros.site/experience' " +
  "or 'https://view.ceros.com/account/experience' and that the experience is published."

const UNPUBLISHED_FLEX_ERROR =
  "This Flex experience isn't published yet. Publish it in Ceros, then link it here."

// The pasted URL and the manifest URL read from a response header are both
// attacker-influenced: this action can be invoked directly through the CMA,
// bypassing the browser-side gate in src/oembed.ts entirely, and the manifest
// URL comes from whatever host the first hop's headers claim. Restrict both
// to the known Ceros hosts before ever fetching them — view.ceros.com is a
// valid pasted-URL host, but the manifest always lives on *.ceros.site.
function isAllowedCerosUrl(rawUrl: string, { allowViewCeros }: { allowViewCeros: boolean }): boolean {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:') return false
    if (allowViewCeros && url.hostname === 'view.ceros.com') return true
    return url.hostname.endsWith('.ceros.site')
  } catch {
    return false
  }
}

// oEmbed's embedType names which variant its `html` actually is. A Studio
// experience can legitimately be scrollable-only, so never assume full-height.
const OEMBED_VARIANT_KEYS: Record<string, 'fullHeight' | 'scrollable'> = {
  'full-height': 'fullHeight',
  scrollable: 'scrollable',
}

// The entry stores the experience ROOT on every path: the picker stores
// viewUrl, Studio oEmbed's url is null, and the Flex manifest's canonicalUrl is
// page-scoped (…/experience/page-1). Only the root is consistent across all
// three. view.ceros.com carries /<account>/<experience>; *.ceros.site carries
// /<experience>.
function experienceRoot(rawUrl: string): string {
  const url = new URL(rawUrl)
  const segments = url.pathname.split('/').filter(Boolean)
  const keep = url.hostname === 'view.ceros.com' ? 2 : 1
  return `${url.origin}/${segments.slice(0, keep).join('/')}`
}

// The experience's own slug — the last-resort label when nothing on the wire
// carries a title. Every URL this action accepts ends in it (…/<experience> on
// *.ceros.site, …/<account>/<experience> on view.ceros.com) and experienceRoot()
// has already narrowed `root` to exactly those segments, so the final segment is
// the slug on both hosts. `root` came out of a successful new URL() there, so
// parsing it again cannot throw.
function slugFromRoot(root: string): string {
  const segments = new URL(root).pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

// Returns null on any transport, status, or parse failure so callers can take
// their degraded path without a try/catch at every site.
async function fetchJson(target: string): Promise<any | null> {
  try {
    const response = await fetch(target, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function resolveViaOembed(
  pastedUrl: string,
  root: string,
  isFlex: boolean
): Promise<Record<string, unknown>> {
  const origin = new URL(pastedUrl).origin
  const oembed = await fetchJson(`${origin}/oembed?url=${encodeURIComponent(pastedUrl)}`)
  const html = oembed?.html
  if (!html) return { error: INVALID_URL_ERROR }

  const variant = OEMBED_VARIANT_KEYS[String(oembed.embedType)] ?? 'fullHeight'
  return {
    data: {
      isFlex,
      name: String(oembed.title || slugFromRoot(root)),
      url: root,
      embedCodes: { [variant]: String(html) },
      // Reached the Flex branch but could not read deliveryModes: offer the
      // iframe embed and tell the UI to explain why inline is missing.
      ...(isFlex ? { inlineUnavailable: true } : {}),
    },
    paging: null,
  }
}

// ── Normalisation helpers ────────────────────────────────────────────────────

function normalizeArray(data: any): any[] {
  if (Array.isArray(data)) {
    // Tuple shape: [[...items], totalCount, "folder"]
    if (data.length > 0 && Array.isArray(data[0])) return data[0]
    return data
  }
  return data?.resources ?? data?.data ?? data?.items ?? []
}

function normalizeFolderTree(data: any): FolderNode[] {
  return normalizeArray(data)
    .map((f: any) => ({
      resourceId: String(f.resourceId ?? f.id ?? ''),
      name: String(f.name ?? f.title ?? ''),
      isFlexFolder: Boolean(f.isFlexFolder),
      children: Array.isArray(f.children) ? normalizeFolderTree(f.children) : [],
    }))
    .filter((f: FolderNode) => f.resourceId && f.name !== 'Account Templates')
}

function normalizeExperiences(data: any): ExperienceNode[] {
  const items = normalizeArray(data)
  return items
    .filter(
      (e: any) =>
        !e.isTemplate &&
        !e.isPasswordProtected &&
        !e.isSSOProtected
    )
    .map((e: any) => ({
      resourceId: String(e.resourceId ?? e.id ?? e.experienceId ?? ''),
      name: String(e.name ?? e.title ?? ''),
      thumbnailUrl: e.thumbnailUrl ?? e.thumbnail ?? undefined,
      isFlexExperience: Boolean(e.isFlexExperience),
    }))
    .filter((e: ExperienceNode) => e.resourceId)
}

function extractPaging(resp: any): Paging | null {
  const p = resp?.paging
  if (!p || typeof p.total !== 'number') return null
  return {
    total: p.total,
    page: p.page,
    pages: p.pages,
    pageSize: p.pageSize,
    next: p.next,
    previous: p.previous,
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
  event: AppActionEvent,
  context: FunctionContext
): Promise<Record<string, unknown>> => {
  try {
    const result = await run(event, context)
    return result
  } catch (err: any) {
    return { error: `Unexpected function error: ${err?.message ?? String(err)}` }
  }
}

const NO_API_KEY_ERROR = 'Ceros API key is not configured. Please set it in the app configuration.'

// Actions that read the Ceros REST API need a configured key; resolveExperience
// reads public pages and must keep working on installs that never set one.
function requireApiKey(context: FunctionContext): string | null {
  return context.appInstallationParameters?.cerosApiKey ?? null
}

async function run(
  event: AppActionEvent,
  context: FunctionContext
): Promise<Record<string, unknown>> {

  const { action, folderId, resourceId, query, url } = event.body as {
    action?: string
    folderId?: string
    resourceId?: string
    query?: string
    url?: string
  }

  switch (action) {
    case 'getFolderTree': {
      const apiKey = requireApiKey(context)
      if (!apiKey) return { error: NO_API_KEY_ERROR }

      const accountResp = await cerosGet('/accounts/current-account', apiKey)
      if (accountResp._error) return { error: accountResp._error }

      const { accountResourceId } = accountResp
      if (!accountResourceId) return { error: 'Could not determine account resource ID.' }

      const qs = parseQuery('getFolderTree', query)
      if (!qs.has('depth')) qs.set('depth', '2') // depth is required by the API
      const treeResp = await cerosGet(
        `/accounts/${accountResourceId}/folder-tree?${qs.toString()}`,
        apiKey
      )
      if (treeResp._error) return { error: treeResp._error }

      return { data: normalizeFolderTree(treeResp), paging: null }
    }

    case 'getFolderExperiences': {
      const apiKey = requireApiKey(context)
      if (!apiKey) return { error: NO_API_KEY_ERROR }
      if (!folderId) return { error: 'folderId is required' }

      const qs = parseQuery('getFolderExperiences', query)
      qs.set('filter', 'published') // only published experiences are selectable
      qs.set('pageSize', '1000')
      const resp = await cerosGet(
        `/folders/${folderId}/experiences?${qs.toString()}`,
        apiKey
      )
      if (resp._error) return { error: resp._error }

      return { data: normalizeExperiences(resp), paging: extractPaging(resp) }
    }

    case 'getEmbedCode': {
      const apiKey = requireApiKey(context)
      if (!apiKey) return { error: NO_API_KEY_ERROR }
      if (!resourceId) return { error: 'resourceId is required' }

      const resp = await cerosGet(`/experiences/${resourceId}/embed-codes`, apiKey)
      if (resp._error) return { error: resp._error }

      // viewUrl and title are required fields on the embed-codes response, so
      // read them directly rather than scraping them back out of the HTML.
      return {
        data: {
          fullHeightEmbedCode: resp.fullHeightEmbedCode,
          scrollableEmbedCode: resp.scrollableEmbedCode,
          inlineEmbedCode: resp.inlineEmbedCode,
          url: String(resp.viewUrl ?? ''),
          title: String(resp.title ?? ''),
        },
        paging: null,
      }
    }

    case 'resolveExperience': {
      // Deliberately no requireApiKey: this reads public pages, and the paste
      // flow must keep working on installs that never configured a key.
      //
      // Trim before anything else. A pasted URL routinely carries surrounding
      // whitespace, and new URL() strips it when parsing — so the host gate and
      // experienceRoot() below would both succeed on an untrimmed string while
      // resolveViaOembed, which encodes the raw string into a query parameter,
      // would bake %20/%0A into the oEmbed lookup and fail upstream with the
      // generic invalid-URL message. The browser trims too, but this action is
      // CMA-invokable, so it cannot rely on that.
      const pastedUrl = typeof url === 'string' ? url.trim() : ''
      if (!pastedUrl) return { error: 'url is required' }

      // The browser-side gate in src/oembed.ts does not protect this action:
      // it can be invoked directly through the CMA. Gate independently here,
      // before the first fetch.
      if (!isAllowedCerosUrl(pastedUrl, { allowViewCeros: true })) return { error: INVALID_URL_ERROR }

      let head: Response
      try {
        head = await fetch(pastedUrl, { method: 'HEAD' })
      } catch {
        return { error: INVALID_URL_ERROR }
      }
      if (!head.ok) return { error: INVALID_URL_ERROR }

      // fetch() follows redirects by default, so an allowlisted first hop can
      // still relocate off-host before we ever trust its headers. Re-validate
      // the final URL rather than switching to redirect: 'manual', so ordinary
      // same-host redirects keep working. `head.url` is legitimately '' on some
      // runtimes (it's a Response property, not guaranteed non-empty) — fall
      // back to the pasted url, which was already validated above and carries
      // no less information when there's no redirect to check.
      if (!isAllowedCerosUrl(head.url || pastedUrl, { allowViewCeros: true })) return { error: INVALID_URL_ERROR }

      const root = experienceRoot(pastedUrl)

      // Route on x-flex-manifest, not the hostname. It is authoritative, it is
      // the one header with a documented contract, and its value — the
      // canonical *.ceros.site manifest URL — is what we need anyway. Never
      // construct the manifest URL: the header exists to prevent exactly that.
      const manifestUrl = head.headers.get('x-flex-manifest')

      if (manifestUrl) {
        // The manifest URL is second-hop and attacker-influenced (it comes
        // from a response header), outside the check above. Only fetch it if
        // it is itself a genuine *.ceros.site URL; otherwise treat it exactly
        // like an unreadable manifest — a bad header should not block the
        // insert.
        if (isAllowedCerosUrl(manifestUrl, { allowViewCeros: false })) {
          // ~4.84 MB buffered to read ~2,588 bytes of deliveryModes. There is
          // no metadata-only variant today; this is the known cost of the
          // design.
          const manifest = await fetchJson(manifestUrl)
          const modes = manifest?.deliveryModes
          const fullHeight = modes?.iframe?.snippet
          const inline = modes?.inline?.snippet

          if (inline || fullHeight) {
            return {
              data: {
                isFlex: true,
                // experience.title is the experience's own label (the author-set
                // SEO title, snapshotted at publish). Deliberately NOT
                // pageMetadata.title, which is the *page's* rendered <title> and
                // resolves page title tag -> SEO title -> page label, so on any
                // page that sets its own title tag it names the page, not the
                // experience. It is optional twice over — unset by default, and
                // absent from manifests published before the field shipped — so
                // fall back to the experience slug rather than an empty title.
                name: String(
                  manifest?.experience?.title ||
                    manifest?.experience?.slug ||
                    slugFromRoot(root)
                ),
                url: root,
                embedCodes: {
                  ...(fullHeight ? { fullHeight: String(fullHeight) } : {}),
                  ...(inline ? { inline: String(inline) } : {}),
                },
                // Read pre-formed from the manifest, never hand-built: the live
                // snippet carries attributes local builders omit.
                ...(inline ? {} : { inlineUnavailable: true }),
              },
              paging: null,
            }
          }
        }

        // Manifest URL failed validation, was unreachable, or had no usable
        // deliveryModes: degrade to oEmbed on the same origin rather than
        // blocking the insert.
        return await resolveViaOembed(pastedUrl, root, true)
      }

      // No manifest header. Per the documented contract the header appears only
      // on a 200 for a published Flex experience, so an unpublished one lands
      // here. x-experience-type is the only signal that distinguishes it — use
      // it for messaging only, and tolerate its absence.
      if (String(head.headers.get('x-experience-type') ?? '').toLowerCase() === 'flex') {
        return { error: UNPUBLISHED_FLEX_ERROR }
      }

      return await resolveViaOembed(pastedUrl, root, false)
    }

    default:
      return { error: `Unknown action: ${String(action)}` }
  }
}
