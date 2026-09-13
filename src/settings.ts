import * as vscode from 'vscode';

const CONFIGURATION_SECTION = 'task-runner';

export type GroupByMode = 'group' | 'none';

export interface TaskRunnerSettings {
	includeAutoDetected: boolean;
	groupBy: GroupByMode;
	showTaskType: boolean;
}

export function readSettings(): TaskRunnerSettings {
	const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
	return {
		includeAutoDetected: config.get<boolean>('includeAutoDetected', false),
		groupBy: config.get<GroupByMode>('groupBy', 'group'),
		showTaskType: config.get<boolean>('showTaskType', true),
	};
}

export function onDidChangeSettings(listener: () => void): vscode.Disposable {
	return vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration(CONFIGURATION_SECTION)) {
			listener();
		}
	});
}
