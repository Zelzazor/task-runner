import * as vscode from 'vscode';
import { onDidChangeSettings, readSettings } from '../settings';

/**
 * Resolves the tasks explicitly defined in workspace tasks.json files
 * (plus auto-detected provider tasks, if task-runner.includeAutoDetected
 * is enabled).
 */
export class TaskSource implements vscode.Disposable {
	private readonly _onDidChangeTasks = new vscode.EventEmitter<void>();
	readonly onDidChangeTasks = this._onDidChangeTasks.event;

	private readonly subscriptions: vscode.Disposable[];
	private cached: Promise<vscode.Task[]> | undefined;

	constructor() {
		const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');
		this.subscriptions = [
			watcher,
			watcher.onDidCreate(() => this.refresh()),
			watcher.onDidChange(() => this.refresh()),
			watcher.onDidDelete(() => this.refresh()),
			onDidChangeSettings(() => this.refresh()),
		];
	}

	getTasks(): Promise<vscode.Task[]> {
		if (!this.cached) {
			this.cached = this.fetchWorkspaceTasks();
		}
		return this.cached;
	}

	refresh(): void {
		this.cached = undefined;
		this._onDidChangeTasks.fire();
	}

	private async fetchWorkspaceTasks(): Promise<vscode.Task[]> {
		const { includeAutoDetected } = readSettings();
		const tasks = await vscode.tasks.fetchTasks();
		return tasks.filter(task => includeAutoDetected || task.source === 'Workspace');
	}

	dispose(): void {
		this.subscriptions.forEach(subscription => subscription.dispose());
		this._onDidChangeTasks.dispose();
	}
}
