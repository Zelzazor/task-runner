import * as vscode from 'vscode';
import { GroupByMode } from '../settings';
import { CustomGroupMap } from '../tasks/customGroups';
import { isWorkspaceFolder } from '../tasks/taskScope';

export const BUILTIN_GROUPS = ['build', 'test', 'other'] as const;
export type BuiltinGroupKind = typeof BUILTIN_GROUPS[number];

/** A built-in bucket ('build'/'test'/'other'), or a task's own `task-runner.group` string. */
export type TaskGroupKind = string;

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

const BUILTIN_GROUP_LABELS: Record<BuiltinGroupKind, string> = {
	build: 'Build',
	test: 'Test',
	other: 'Other',
};

export function groupLabel(group: TaskGroupKind): string {
	return BUILTIN_GROUP_LABELS[group as BuiltinGroupKind] ?? group;
}

function isBuiltinGroup(group: TaskGroupKind): group is BuiltinGroupKind {
	return (BUILTIN_GROUPS as readonly string[]).includes(group);
}

/**
 * A task's own `task-runner.group` (read from tasks.json's raw JSON, since
 * VS Code strips unknown properties from task.definition) takes priority
 * over VS Code's built-in Build/Test/Other classification.
 */
export function classifyTask(task: vscode.Task, customGroups: CustomGroupMap = new Map()): TaskGroupKind {
	const customGroup = customGroups.get(task.name);
	if (customGroup !== undefined) {
		return customGroup;
	}
	const groupId = task.group?.id;
	if (groupId === vscode.TaskGroup.Build.id || groupId === vscode.TaskGroup.Rebuild.id || groupId === vscode.TaskGroup.Clean.id) {
		return 'build';
	}
	if (groupId === vscode.TaskGroup.Test.id) {
		return 'test';
	}
	return 'other';
}

function groupTasks(tasks: vscode.Task[], customGroups: CustomGroupMap): GroupNode[] {
	const order: TaskGroupKind[] = [];
	const byGroup = new Map<TaskGroupKind, TaskNode[]>();
	for (const task of tasks) {
		const group = classifyTask(task, customGroups);
		if (!byGroup.has(group)) {
			byGroup.set(group, []);
			order.push(group);
		}
		byGroup.get(group)!.push({ kind: 'task', task });
	}

	// Built-in buckets always come first in their usual order; custom groups
	// follow, alphabetically.
	const builtin = order.filter(isBuiltinGroup).sort((a, b) => BUILTIN_GROUPS.indexOf(a) - BUILTIN_GROUPS.indexOf(b));
	const custom = order.filter(group => !isBuiltinGroup(group)).sort((a, b) => a.localeCompare(b));

	return [...builtin, ...custom].map((group): GroupNode => ({ kind: 'group', group, tasks: byGroup.get(group)! }));
}

function flattenTasks(tasks: vscode.Task[]): TaskNode[] {
	return [...tasks]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((task): TaskNode => ({ kind: 'task', task }));
}

function buildChildren(tasks: vscode.Task[], groupBy: GroupByMode, customGroups: CustomGroupMap): TreeNode[] {
	return groupBy === 'none' ? flattenTasks(tasks) : groupTasks(tasks, customGroups);
}

function folderKey(folder: vscode.WorkspaceFolder): string {
	return folder.uri.toString();
}

/**
 * Builds the tree shown in the view: a folder layer only appears when the
 * workspace has more than one root, otherwise tasks go straight into their
 * children (Build/Test/Other/custom buckets, or a flat list per task-runner.groupBy).
 */
export function buildTaskTree(
	tasks: vscode.Task[],
	folders: readonly vscode.WorkspaceFolder[],
	groupBy: GroupByMode = 'group',
	customGroups: CustomGroupMap = new Map(),
): TreeNode[] {
	if (folders.length <= 1) {
		return buildChildren(tasks, groupBy, customGroups);
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
			children: buildChildren(byFolder.get(folderKey(folder)) ?? [], groupBy, customGroups),
		}))
		.filter(node => node.children.length > 0);
}
