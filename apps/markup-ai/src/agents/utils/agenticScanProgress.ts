/** True once every catalog agent in this run has emitted `agent_result` (normalized ids in `reported`). */
export function runCatalogAgentsFullyReported(
  requestedCatalogIds: readonly string[],
  reportedIds: ReadonlySet<string>,
): boolean {
  return requestedCatalogIds.length > 0 && requestedCatalogIds.every((id) => reportedIds.has(id));
}
