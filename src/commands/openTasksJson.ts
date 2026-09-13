import * as vscode from 'vscode';
import { TreeNode } from '../tree/treeNodes';

async function resolveFolder(): Promise<vscode.WorkspaceFolder | undefined> {
	const folders = vscode.workspace.workspaceFolders ?? [];
	if (folders.length <= 1) {
		return folders[0];
	}
	return vscode.window.showWorkspaceFolderPick();
}

export function registerOpenTasksJsonCommand(): vscode.Disposable {
	return vscode.commands.registerCommand('task-runner.openTasksJson', async (node?: TreeNode) => {
		const folder = node?.kind === 'folder' ? node.folder : await resolveFolder();
		if (!folder) {
			return;
		}
		const uri = vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');
		try {
			await vscode.window.showTextDocument(uri);
		} catch {
			await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
		}
	});
}
