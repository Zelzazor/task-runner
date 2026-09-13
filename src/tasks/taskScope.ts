import * as vscode from 'vscode';

export function isWorkspaceFolder(scope: vscode.Task['scope']): scope is vscode.WorkspaceFolder {
	return typeof scope === 'object' && scope !== null && 'uri' in scope;
}
