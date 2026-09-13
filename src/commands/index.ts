import * as vscode from 'vscode';
import { TaskSource } from '../tasks/taskSource';
import { TaskTreeDataProvider } from '../tree/taskTreeDataProvider';
import { registerRefreshCommand } from './refresh';

export interface CommandDependencies {
	taskSource: TaskSource;
	treeDataProvider: TaskTreeDataProvider;
}

export function registerCommands(context: vscode.ExtensionContext, deps: CommandDependencies): void {
	context.subscriptions.push(registerRefreshCommand(deps.taskSource));
}
