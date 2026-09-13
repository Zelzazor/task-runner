import * as vscode from 'vscode';
import { TaskExecutionTracker } from '../tasks/taskExecutionTracker';
import { TaskSource } from '../tasks/taskSource';
import { TaskTreeDataProvider } from '../tree/taskTreeDataProvider';
import { registerOpenTasksJsonCommand } from './openTasksJson';
import { registerRefreshCommand } from './refresh';
import { registerRevealTaskInJsonCommand } from './revealTaskInJson';
import { registerRunTaskCommand } from './runTask';
import { registerTerminateTaskCommand } from './terminateTask';

export interface CommandDependencies {
	taskSource: TaskSource;
	treeDataProvider: TaskTreeDataProvider;
	executionTracker: TaskExecutionTracker;
}

export function registerCommands(context: vscode.ExtensionContext, deps: CommandDependencies): void {
	context.subscriptions.push(
		registerRefreshCommand(deps.taskSource),
		registerRunTaskCommand(),
		registerOpenTasksJsonCommand(),
		registerRevealTaskInJsonCommand(),
		registerTerminateTaskCommand(deps.executionTracker),
	);
}
