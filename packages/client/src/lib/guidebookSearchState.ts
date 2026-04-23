let persistedQuery = "";

export function getPersistedGuidebookQuery(): string {
  return persistedQuery;
}

export function setPersistedGuidebookQuery(query: string): void {
  persistedQuery = query;
}
