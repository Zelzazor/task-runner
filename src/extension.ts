import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { TaskExecutionTracker } from './tasks/taskExecutionTracker';
import { TaskSource } from './tasks/taskSource';
import { TaskTreeDataProvider } from './tree/taskTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
	const taskSource = new TaskSource();
	const executionTracker = new TaskExecutionTracker();
	const treeDataProvider = new TaskTreeDataProvider(taskSource, executionTracker);
	const treeView = vscode.window.createTreeView('taskRunner.tasksView', { treeDataProvider });

	const setLoading = (loading: boolean) =>
		vscode.commands.executeCommand('setContext', 'taskRunner.tasksLoading', loading);

	const updateHasTasksContext = async () => {
		await setLoading(true);
		const tasks = await taskSource.getTasks();
		await vscode.commands.executeCommand('setContext', 'taskRunner.hasTasks', tasks.length > 0);
		await setLoading(false);
	};
	taskSource.onDidChangeTasks(updateHasTasksContext);
	void updateHasTasksContext();

	registerCommands(context, { taskSource, treeDataProvider, executionTracker });

	context.subscriptions.push(taskSource, executionTracker, treeView);
}

export function deactivate() {}
