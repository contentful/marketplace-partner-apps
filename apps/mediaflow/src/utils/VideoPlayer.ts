/**
 * The only origin the Mediaflow video player is loaded from.
 * The stored embedCode is never rendered as HTML: anyone with write access to the entry can change it through the CMA,
 * so only the src of its iframe is used, and only if it points to the Mediaflow player.
 */
export const PLAYER_ORIGIN = "https://play.mediaflow.com";

/**
 * Extracts the player URL from a stored embed code.
 *
 * @param embedCode - The embed code the file selector returned
 * @returns The absolute player URL, or null if the embed code has no iframe whose src is on PLAYER_ORIGIN
 */
export function getVideoPlayerSrc(embedCode: string | undefined | null): string | null {
  if(!embedCode) {
    return null;
  }
  const src = new DOMParser()
    .parseFromString(embedCode, "text/html")
    .querySelector("iframe")
    ?.getAttribute("src");
  if(!src) {
    return null;
  }
  try {
    // Older values have a protocol relative src (//play.mediaflow.com/...), which resolves to https here
    const url = new URL(src, PLAYER_ORIGIN);
    return url.protocol === "https:" && url.origin === PLAYER_ORIGIN ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * @param width - The width of the video in pixels
 * @param height - The height of the video in pixels
 * @returns A CSS aspect-ratio for the player, 16 / 9 if the dimensions are unknown
 */
export function getVideoAspectRatio(width: string | number | undefined, height: string | number | undefined): string {
  const videoWidth = Number(width);
  const videoHeight = Number(height);
  if(!(videoWidth > 0) || !(videoHeight > 0)) {
    return "16 / 9";
  }
  return `${videoWidth} / ${videoHeight}`;
}
