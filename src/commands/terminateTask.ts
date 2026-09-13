import * as vscode from 'vscode';
import { TaskExecutionTracker } from '../tasks/taskExecutionTracker';
import { TaskNode } from '../tree/treeNodes';
import { resolveTaskArg } from './taskArg';

export function registerTerminateTaskCommand(executionTracker: TaskExecutionTracker): vscode.Disposable {
	return vscode.commands.registerCommand('task-runner.terminateTask', (arg: TaskNode | vscode.Task) => {
		executionTracker.terminate(resolveTaskArg(arg));
	});
}
