import * as vscode from 'vscode';
import { TaskExecutionTracker } from '../tasks/taskExecutionTracker';
import { taskKey, TaskKey } from '../tasks/taskKey';
import { TaskSource } from '../tasks/taskSource';
import { groupIcon, taskIcon } from './icons';
import { buildTaskTree, FolderNode, GroupNode, groupLabel, TaskNode, TreeNode } from './treeNodes';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private readonly taskNodesByKey = new Map<TaskKey, TaskNode>();

	constructor(
		private readonly taskSource: TaskSource,
		private readonly executionTracker: TaskExecutionTracker,
	) {
		taskSource.onDidChangeTasks(() => this.refresh());
		executionTracker.onDidChangeState(key => this.refresh(this.taskNodesByKey.get(key)));
	}

	refresh(node?: TreeNode): void {
		this._onDidChangeTreeData.fire(node);
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		switch (element.kind) {
			case 'folder':
				return this.folderTreeItem(element);
			case 'group':
				return this.groupTreeItem(element);
			case 'task':
				return this.taskTreeItem(element);
		}
	}

	async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		if (!element) {
			const tasks = await this.taskSource.getTasks();
			const tree = buildTaskTree(tasks, vscode.workspace.workspaceFolders ?? []);
			this.indexTaskNodes(tree);
			return tree;
		}
		if (element.kind === 'folder') {
			return element.groups;
		}
		if (element.kind === 'group') {
			return element.tasks;
		}
		return [];
	}

	private indexTaskNodes(nodes: TreeNode[]): void {
		this.taskNodesByKey.clear();
		const visit = (node: TreeNode): void => {
			if (node.kind === 'task') {
				this.taskNodesByKey.set(taskKey(node.task), node);
			} else if (node.kind === 'group') {
				node.tasks.forEach(visit);
			} else {
				node.groups.forEach(visit);
			}
		};
		nodes.forEach(visit);
	}

	private folderTreeItem(node: FolderNode): vscode.TreeItem {
		const item = new vscode.TreeItem(node.folder.name, vscode.TreeItemCollapsibleState.Expanded);
		item.iconPath = new vscode.ThemeIcon('folder');
		item.contextValue = 'folder';
		return item;
	}

	private groupTreeItem(node: GroupNode): vscode.TreeItem {
		const item = new vscode.TreeItem(groupLabel(node.group), vscode.TreeItemCollapsibleState.Expanded);
		item.iconPath = groupIcon(node.group);
		item.contextValue = 'group';
		return item;
	}

	private taskTreeItem(node: TaskNode): vscode.TreeItem {
		const { task } = node;
		const state = this.executionTracker.getState(task);
		const item = new vscode.TreeItem(task.name, vscode.TreeItemCollapsibleState.None);
		item.id = taskKey(task);
		item.iconPath = taskIcon(state);
		item.contextValue = state === 'running' ? 'task-running' : 'task-idle';
		item.command = { command: 'task-runner.runTask', title: 'Run Task', arguments: [node] };
		if (task.group?.isDefault) {
			item.description = 'default';
		}
		return item;
	}
}
