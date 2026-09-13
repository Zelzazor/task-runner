import * as vscode from 'vscode';
import { GroupByMode } from '../settings';
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
	readonly children: TreeNode[];
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

function flattenTasks(tasks: vscode.Task[]): TaskNode[] {
	return [...tasks]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((task): TaskNode => ({ kind: 'task', task }));
}

function buildChildren(tasks: vscode.Task[], groupBy: GroupByMode): TreeNode[] {
	return groupBy === 'none' ? flattenTasks(tasks) : groupTasks(tasks);
}

function folderKey(folder: vscode.WorkspaceFolder): string {
	return folder.uri.toString();
}

/**
 * Builds the tree shown in the view: a folder layer only appears when the
 * workspace has more than one root, otherwise tasks go straight into their
 * children (Build/Test/Other buckets, or a flat list per task-runner.groupBy).
 */
export function buildTaskTree(tasks: vscode.Task[], folders: readonly vscode.WorkspaceFolder[], groupBy: GroupByMode = 'group'): TreeNode[] {
	if (folders.length <= 1) {
		return buildChildren(tasks, groupBy);
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
			children: buildChildren(byFolder.get(folderKey(folder)) ?? [], groupBy),
		}))
		.filter(node => node.children.length > 0);
}
