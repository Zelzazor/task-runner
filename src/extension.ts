import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { TaskSource } from './tasks/taskSource';
import { TaskTreeDataProvider } from './tree/taskTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
	const taskSource = new TaskSource();
	const treeDataProvider = new TaskTreeDataProvider(taskSource);
	const treeView = vscode.window.createTreeView('taskRunner.tasksView', { treeDataProvider });

	const updateHasTasksContext = async () => {
		const tasks = await taskSource.getTasks();
		await vscode.commands.executeCommand('setContext', 'taskRunner.hasTasks', tasks.length > 0);
	};
	taskSource.onDidChangeTasks(updateHasTasksContext);
	void updateHasTasksContext();

	registerCommands(context, { taskSource, treeDataProvider });

	context.subscriptions.push(taskSource, treeView);
}

export function deactivate() {}
