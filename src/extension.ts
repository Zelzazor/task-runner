import * as vscode from 'vscode';

class EmptyTaskTreeDataProvider implements vscode.TreeDataProvider<never> {
	getTreeItem(element: never): vscode.TreeItem {
		return element;
	}

	getChildren(): never[] {
		return [];
	}
}

export function activate(context: vscode.ExtensionContext) {
	const treeView = vscode.window.createTreeView('taskRunner.tasksView', {
		treeDataProvider: new EmptyTaskTreeDataProvider(),
	});

	context.subscriptions.push(treeView);
}

export function deactivate() {}
