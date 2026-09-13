import React, { useMemo } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client';
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client';
import { fileAddressFor } from '@deepseek-ai/dsh-util-workspace-path';
import { Dashboard } from './Dashboard.tsx';
import { composerPort, filePort, skillSources } from './dsh.ts';
import { remote } from './remote.ts';

export const inject = ['slots', 'sidebarRightTabs', 'remote', 'remote.workspaceFiles', 'remote.skills', 'sessions'];
export async function apply(ctx: Context): Promise<void> {
  const unmount = await ctx.remote.$mount(remote);
  ctx.effect(() => unmount);
  ctx.inject(['remote.tabiletMemory'], registerPanel);
}
function registerPanel(ctx: Context): void {
  ctx.effect(() => ctx.sidebarRightTabs.register({ id: 'tabilet-skills', kind: 'memory-bank', title: () => 'Memory Bank', guide: [{ order: 60, title: () => 'Memory Bank', description: () => 'Tasks, memory, history, and workflow requests' }] }));
  function Body(props: PropsRuntime<'sidebar.right.pane.tab'>) {
    const { sessionId, useTabInfo } = props;
    const info = useTabInfo();
    const port = useMemo(() => filePort(ctx, sessionId), [sessionId]);
    const composer = useMemo(() => composerPort(ctx, sessionId), [sessionId]);
    const sources = useMemo(() => (signal: AbortSignal) => skillSources(ctx, sessionId, signal), [sessionId]);
    return <Dashboard key={sessionId} sessionId={sessionId} visible={info.tab.visible} port={port} composer={composer} sources={sources} navigate={(path, line) => info.tab.actions.openResource(fileAddressFor(sessionId, undefined, path), line ? { params: { line } } : undefined)} />;
  }
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: 'tabilet-skills' }, Body)));
}
