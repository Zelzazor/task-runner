import * as vscode from 'vscode';
import { isWorkspaceFolder } from '../tasks/taskScope';

export type TaskGroupKind = 'build' | 'test' | 'other';

export interface TaskNode {
	readonly kind: 'task';
	readonly task: vscode.Task;
}

export interface GroupNode {
	readonly kind: 'group';
	readonly group: TaskGroupKind;
	readonly tasks: TaskNode[];
}

export interface FolderNode {
	readonly kind: 'folder';
	readonly folder: vscode.WorkspaceFolder;
	readonly groups: GroupNode[];
}

export type TreeNode = FolderNode | GroupNode | TaskNode;

const GROUP_ORDER: readonly TaskGroupKind[] = ['build', 'test', 'other'];

const GROUP_LABELS: Record<TaskGroupKind, string> = {
	build: 'Build',
	test: 'Test',
	other: 'Other',
};

export function groupLabel(group: TaskGroupKind): string {
	return GROUP_LABELS[group];
}

export function classifyTask(task: vscode.Task): TaskGroupKind {
	const groupId = task.group?.id;
	if (groupId === vscode.TaskGroup.Build.id || groupId === vscode.TaskGroup.Rebuild.id || groupId === vscode.TaskGroup.Clean.id) {
		return 'build';
	}
	if (groupId === vscode.TaskGroup.Test.id) {
		return 'test';
	}
	return 'other';
}

function groupTasks(tasks: vscode.Task[]): GroupNode[] {
	const byGroup = new Map<TaskGroupKind, TaskNode[]>(GROUP_ORDER.map(group => [group, []]));
	for (const task of tasks) {
		byGroup.get(classifyTask(task))!.push({ kind: 'task', task });
	}
	return GROUP_ORDER
		.map((group): GroupNode => ({ kind: 'group', group, tasks: byGroup.get(group)! }))
		.filter(node => node.tasks.length > 0);
}

function folderKey(folder: vscode.WorkspaceFolder): string {
	return folder.uri.toString();
}

/**
 * Builds the tree shown in the view: a folder layer only appears when the
 * workspace has more than one root, otherwise tasks go straight into their
 * Build/Test/Other group buckets.
 */
export function buildTaskTree(tasks: vscode.Task[], folders: readonly vscode.WorkspaceFolder[]): TreeNode[] {
	if (folders.length <= 1) {
		return groupTasks(tasks);
	}

	const byFolder = new Map<string, vscode.Task[]>(folders.map(folder => [folderKey(folder), []]));
	for (const task of tasks) {
		if (isWorkspaceFolder(task.scope)) {
			byFolder.get(folderKey(task.scope))?.push(task);
		}
	}

	return folders
		.map((folder): FolderNode => ({
			kind: 'folder',
			folder,
			groups: groupTasks(byFolder.get(folderKey(folder)) ?? []),
		}))
		.filter(node => node.groups.length > 0);
}
