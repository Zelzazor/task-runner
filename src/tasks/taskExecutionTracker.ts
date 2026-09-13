import * as vscode from 'vscode';
import { taskKey, TaskKey } from './taskKey';

export type TaskRunState = 'running' | 'success' | 'failure';

/**
 * Tracks the live run state of tasks so the tree view can show a spinner
 * while running and a check/error icon afterwards, and so a "stop" action
 * can terminate a specific running task.
 */
export class TaskExecutionTracker implements vscode.Disposable {
	private readonly _onDidChangeState = new vscode.EventEmitter<TaskKey>();
	readonly onDidChangeState = this._onDidChangeState.event;

	private readonly executions = new Map<TaskKey, vscode.TaskExecution>();
	private readonly states = new Map<TaskKey, TaskRunState>();
	private readonly subscriptions: vscode.Disposable[];

	constructor() {
		this.subscriptions = [
			vscode.tasks.onDidStartTask(e => this.handleStart(e.execution)),
			vscode.tasks.onDidEndTaskProcess(e => this.handleProcessEnd(e.execution, e.exitCode)),
			vscode.tasks.onDidEndTask(e => this.handleEnd(e.execution)),
		];
	}

	getState(task: vscode.Task): TaskRunState | undefined {
		return this.states.get(taskKey(task));
	}

	terminate(task: vscode.Task): void {
		this.executions.get(taskKey(task))?.terminate();
	}

	private handleStart(execution: vscode.TaskExecution): void {
		const key = taskKey(execution.task);
		this.executions.set(key, execution);
		this.states.set(key, 'running');
		this._onDidChangeState.fire(key);
	}

	private handleProcessEnd(execution: vscode.TaskExecution, exitCode: number | undefined): void {
		const key = taskKey(execution.task);
		if (exitCode === undefined) {
			// Terminated rather than exited - fall back to idle.
			this.states.delete(key);
		} else {
			this.states.set(key, exitCode === 0 ? 'success' : 'failure');
		}
		this._onDidChangeState.fire(key);
	}

	private handleEnd(execution: vscode.TaskExecution): void {
		const key = taskKey(execution.task);
		// Tasks without a process (CustomExecution) never fire onDidEndTaskProcess,
		// so this is the only signal that a still-"running" task has finished.
		if (this.states.get(key) === 'running') {
			this.states.delete(key);
			this._onDidChangeState.fire(key);
		}
		this.executions.delete(key);
	}

	dispose(): void {
		this.subscriptions.forEach(subscription => subscription.dispose());
		this._onDidChangeState.dispose();
	}
}
