import * as vscode from 'vscode';
import { TaskNode } from '../tree/treeNodes';
import { resolveTaskArg } from './taskArg';

export function registerRunTaskCommand(): vscode.Disposable {
	return vscode.commands.registerCommand('task-runner.runTask', (arg: TaskNode | vscode.Task) => {
		return vscode.tasks.executeTask(resolveTaskArg(arg));
	});
}
