import * as vscode from 'vscode';
import { TaskSource } from '../tasks/taskSource';
import { TaskTreeDataProvider } from '../tree/taskTreeDataProvider';
import { registerOpenTasksJsonCommand } from './openTasksJson';
import { registerRefreshCommand } from './refresh';
import { registerRevealTaskInJsonCommand } from './revealTaskInJson';
import { registerRunTaskCommand } from './runTask';

export interface CommandDependencies {
	taskSource: TaskSource;
	treeDataProvider: TaskTreeDataProvider;
}

export function registerCommands(context: vscode.ExtensionContext, deps: CommandDependencies): void {
	context.subscriptions.push(
		registerRefreshCommand(deps.taskSource),
		registerRunTaskCommand(),
		registerOpenTasksJsonCommand(),
		registerRevealTaskInJsonCommand(),
	);
}
