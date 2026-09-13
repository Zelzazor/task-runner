import * as assert from 'assert';
import * as vscode from 'vscode';
import { readCustomGroups } from '../tasks/customGroups';

suite('customGroups integration', () => {
	test('reads task-runner.group from the fixture workspace tasks.json', () => {
		const customGroups = readCustomGroups(vscode.workspace.workspaceFolders ?? []);
		assert.strictEqual(customGroups.get('Deploy'), 'Deploy');
		assert.strictEqual(customGroups.get('Build App'), undefined);
	});
});
