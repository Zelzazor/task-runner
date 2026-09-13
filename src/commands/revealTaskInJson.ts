import * as vscode from 'vscode';
import { isWorkspaceFolder } from '../tasks/taskScope';
import { TaskNode } from '../tree/treeNodes';
import { resolveTaskArg } from './taskArg';

function findTaskOffset(text: string, taskName: string): number {
	const needle = taskName.replace(/"/g, '\\"');
	const patterns = [`"label"`, `"script"`, `"taskName"`].map(key => new RegExp(`${key}"\\s*:\\s*"${needle}"`));
	for (const pattern of patterns) {
		const match = pattern.exec(text);
		if (match) {
			return match.index;
		}
	}
	return -1;
}

export function registerRevealTaskInJsonCommand(): vscode.Disposable {
	return vscode.commands.registerCommand('task-runner.revealTaskInJson', async (arg: TaskNode | vscode.Task) => {
		const task = resolveTaskArg(arg);
		if (!isWorkspaceFolder(task.scope)) {
			return;
		}
		const uri = vscode.Uri.joinPath(task.scope.uri, '.vscode', 'tasks.json');
		let document: vscode.TextDocument;
		try {
			document = await vscode.workspace.openTextDocument(uri);
		} catch {
			return;
		}
		const editor = await vscode.window.showTextDocument(document);
		const offset = findTaskOffset(document.getText(), task.name);
		if (offset === -1) {
			return;
		}
		const position = document.positionAt(offset);
		editor.selection = new vscode.Selection(position, position);
		editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
	});
}
