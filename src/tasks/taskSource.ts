import * as vscode from 'vscode';

/**
 * Resolves the tasks explicitly defined in workspace tasks.json files,
 * excluding tasks auto-detected by other providers (npm, gulp, etc.).
 */
export class TaskSource implements vscode.Disposable {
	private readonly _onDidChangeTasks = new vscode.EventEmitter<void>();
	readonly onDidChangeTasks = this._onDidChangeTasks.event;

	private readonly watcher: vscode.FileSystemWatcher;
	private cached: Promise<vscode.Task[]> | undefined;

	constructor() {
		this.watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');
		this.watcher.onDidCreate(() => this.refresh());
		this.watcher.onDidChange(() => this.refresh());
		this.watcher.onDidDelete(() => this.refresh());
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
		const tasks = await vscode.tasks.fetchTasks();
		return tasks.filter(task => task.source === 'Workspace');
	}

	dispose(): void {
		this.watcher.dispose();
		this._onDidChangeTasks.dispose();
	}
}
