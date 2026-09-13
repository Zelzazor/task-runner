import * as vscode from 'vscode';
import { TaskSource } from '../tasks/taskSource';

export function registerRefreshCommand(taskSource: TaskSource): vscode.Disposable {
	return vscode.commands.registerCommand('task-runner.refresh', () => {
		taskSource.refresh();
	});
}
