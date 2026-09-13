import * as vscode from 'vscode';
import { TaskSource } from '../tasks/taskSource';
import { buildTaskTree, FolderNode, GroupNode, groupLabel, TaskGroupKind, TaskNode, TreeNode } from './treeNodes';

const GROUP_ICON_IDS: Record<TaskGroupKind, string> = {
	build: 'tools',
	test: 'beaker',
	other: 'play-circle',
};

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(private readonly taskSource: TaskSource) {
		taskSource.onDidChangeTasks(() => this.refresh());
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
			return buildTaskTree(tasks, vscode.workspace.workspaceFolders ?? []);
		}
		if (element.kind === 'folder') {
			return element.groups;
		}
		if (element.kind === 'group') {
			return element.tasks;
		}
		return [];
	}

	private folderTreeItem(node: FolderNode): vscode.TreeItem {
		const item = new vscode.TreeItem(node.folder.name, vscode.TreeItemCollapsibleState.Expanded);
		item.iconPath = new vscode.ThemeIcon('folder');
		item.contextValue = 'folder';
		return item;
	}

	private groupTreeItem(node: GroupNode): vscode.TreeItem {
		const item = new vscode.TreeItem(groupLabel(node.group), vscode.TreeItemCollapsibleState.Expanded);
		item.iconPath = new vscode.ThemeIcon(GROUP_ICON_IDS[node.group]);
		item.contextValue = 'group';
		return item;
	}

	private taskTreeItem(node: TaskNode): vscode.TreeItem {
		const { task } = node;
		const item = new vscode.TreeItem(task.name, vscode.TreeItemCollapsibleState.None);
		item.iconPath = new vscode.ThemeIcon('circle-outline');
		item.contextValue = 'task-idle';
		if (task.group?.isDefault) {
			item.description = 'default';
		}
		return item;
	}
}
