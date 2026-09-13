import * as vscode from 'vscode';

const CUSTOM_GROUP_PROPERTY = 'task-runner.group';

export type CustomGroupMap = ReadonlyMap<string, string>;

interface RawTaskEntry {
	readonly label?: unknown;
	readonly options?: {
		readonly [CUSTOM_GROUP_PROPERTY]?: unknown;
	};
}

/**
 * VS Code strips unknown properties from a shell/process task's
 * `task.definition`, so a custom `task-runner.group` property set on a task
 * in tasks.json can't be read back through fetchTasks(). Reading tasks.json's
 * raw JSON via getConfiguration('tasks', folder) instead works the same way
 * launch.json is read via getConfiguration('launch'). It's nested under
 * `options` because the root task schema has `additionalProperties: false`
 * (a top-level custom property gets flagged in the editor) while `options`
 * explicitly allows arbitrary extra properties.
 */
export function readCustomGroups(folders: readonly vscode.WorkspaceFolder[]): CustomGroupMap {
	const map = new Map<string, string>();
	const scopes: readonly (vscode.WorkspaceFolder | undefined)[] = folders.length > 0 ? folders : [undefined];
	for (const scope of scopes) {
		const rawTasks = vscode.workspace.getConfiguration('tasks', scope).get<RawTaskEntry[]>('tasks', []);
		for (const entry of rawTasks) {
			const label = entry.label;
			const group = entry.options?.[CUSTOM_GROUP_PROPERTY];
			if (typeof label !== 'string' || typeof group !== 'string') {
				continue;
			}
			const trimmed = group.trim();
			if (trimmed.length > 0) {
				map.set(label, trimmed);
			}
		}
	}
	return map;
}
