export const commands = ['next', 'goal', 'reconcile', 'upgrade', 'init', 'archive'] as const;
export type Command = typeof commands[number];
export interface RequestOptions { order?: string; completion?: string; policy?: 'task' | 'none'; review?: string; scope?: string; resume?: boolean }
export function prepare(command: Command, options: RequestOptions = {}): string {
  const prefix = `/memory-bank-${command}`;
  switch (command) {
    case 'next': return `${prefix} ${options.resume ? 'Resume the sole in-progress row' : 'Select the next actionable row'} using the current milestone priority, dependencies, and skill selection rules. Re-read the ledger before selecting work; surface conflicts. A task marker does not establish exclusive ownership. EXTERNAL_MUTATIONS: none.`;
    case 'goal': {
      const ids = options.order?.split(/\s*(?:->|,|\n)\s*/).filter(Boolean) || [];
      if (!ids.length || ids.some(id => !/^[A-Z](?:0[1-9]|[1-9][0-9])$/.test(id)) || new Set(ids).size !== ids.length) throw new Error('Enter a unique explicit milestone order, such as M01 -> M02.');
      if (!options.completion?.trim()) throw new Error('Enter the completion conditions.');
      return `${prefix} Follow the project GOAL.md for ${ids.join(' -> ')}.\nCompletion conditions: ${options.completion.trim()}\nCOMMIT_POLICY: ${options.policy || 'task'}\nEXTERNAL_MUTATIONS: none\nReconcile permanent IDs against the current active and retired records before execution. Cancellation and supersession do not prove completion.`;
    }
    case 'reconcile':
      if (!options.review?.trim()) throw new Error('Enter a local review path or a user-supplied URL.');
      return `${prefix} Review source (user-supplied text): ${JSON.stringify(options.review.trim())}. Revalidate findings against the current project and propose the complete disposition and file actions for approval before writes. For a remote source, show the exact URL and obtain separate explicit confirmation before fetching. Preparing this request has not fetched the source. Do not implement or commit findings.`;
    case 'upgrade': return `${prefix} Compare the existing project rules with the bundled contract and present a complete proposal for approval before writes. Preserve local policies, permanent IDs, task state, review counters, and frozen history. Do not initialize, implement, commit, or retire milestones as a side effect.`;
    case 'init': return `${prefix} Discover the delivery boundary${options.scope?.trim() ? ` described here: ${JSON.stringify(options.scope.trim())}` : ' from the current project and interview'}. Run the adaptive topology gate and archive preflight where required. Load the write contract and obtain approval for the complete milestone and file-action proposal before writes.`;
    case 'archive': return `${prefix} Inspect the existing package${options.scope?.trim() ? ` with this requested context: ${JSON.stringify(options.scope.trim())}` : ' and discover stable contexts'}. Load the write contract and propose context lanes and file actions for approval before writes. Require clean Git HEAD where Git exists. Preserve verified snapshots; record facts only. Do not create plans, status rows, commits, or external changes.`;
  }
}
export interface Draft { draft: string; draftRev: number; phase: string; attachmentIds: readonly unknown[]; occurrences: readonly unknown[]; claim?: unknown }
export interface Composer {
  snapshot(): Draft;
  insert(text: string, revision: number): boolean;
  isCurrent(): boolean;
}
export function insertPrepared(composer: Composer | undefined, text: string, revision: number): string {
  if (!composer) return 'Composer capability unavailable. Copy the request.';
  const state = composer.snapshot();
  if (!composer.isCurrent() || state.draftRev !== revision) return 'Session or draft changed. Existing draft preserved; copy the request.';
  if (state.phase !== 'plain' || state.claim || state.draft !== '' || state.attachmentIds.length || state.occurrences.length) return 'Existing draft or attachments preserved. Copy the request.';
  return composer.insert(text, revision) ? 'Inserted into the draft. Review it and send normally.' : 'Draft changed or composer is unavailable. Copy the request.';
}
