import * as vscode from 'vscode';
import { TaskRunState } from '../tasks/taskExecutionTracker';
import { BuiltinGroupKind, TaskGroupKind } from './treeNodes';

const GROUP_ICON_IDS: Record<BuiltinGroupKind, string> = {
	build: 'tools',
	test: 'beaker',
	other: 'play-circle',
};

const CUSTOM_GROUP_ICON_ID = 'tag';

export function groupIcon(group: TaskGroupKind): vscode.ThemeIcon {
	return new vscode.ThemeIcon(GROUP_ICON_IDS[group as BuiltinGroupKind] ?? CUSTOM_GROUP_ICON_ID);
}

export function taskIcon(state: TaskRunState | undefined): vscode.ThemeIcon {
	switch (state) {
		case 'running':
			return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.blue'));
		case 'success':
			return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
		case 'failure':
			return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
		default:
			return new vscode.ThemeIcon('circle-outline');
	}
}
