import * as vscode from 'vscode';
import { isWorkspaceFolder } from './taskScope';

export type TaskKey = string;

/**
 * Task objects returned by fetchTasks() aren't reference-stable across
 * calls, so run-state and tree-node lookups correlate tasks by this
 * composite key instead.
 */
export function taskKey(task: vscode.Task): TaskKey {
	const scopeKey = isWorkspaceFolder(task.scope) ? task.scope.uri.toString() : String(task.scope);
	return `${task.source}::${scopeKey}::${task.name}`;
}
