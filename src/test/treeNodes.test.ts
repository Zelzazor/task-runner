import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildTaskTree, classifyTask } from '../tree/treeNodes';

function makeFolder(name: string): vscode.WorkspaceFolder {
	return { uri: vscode.Uri.file(`/${name}`), name, index: 0 };
}

function makeTask(name: string, options: { group?: vscode.TaskGroup; scope?: vscode.WorkspaceFolder } = {}): vscode.Task {
	const scope = options.scope ?? vscode.TaskScope.Workspace;
	const task = new vscode.Task({ type: 'shell' }, scope, name, 'test-source');
	if (options.group) {
		task.group = options.group;
	}
	return task;
}

suite('treeNodes', () => {
	test('classifyTask maps groups to build/test/other buckets', () => {
		assert.strictEqual(classifyTask(makeTask('a', { group: vscode.TaskGroup.Build })), 'build');
		assert.strictEqual(classifyTask(makeTask('a', { group: vscode.TaskGroup.Rebuild })), 'build');
		assert.strictEqual(classifyTask(makeTask('a', { group: vscode.TaskGroup.Clean })), 'build');
		assert.strictEqual(classifyTask(makeTask('a', { group: vscode.TaskGroup.Test })), 'test');
		assert.strictEqual(classifyTask(makeTask('a')), 'other');
	});

	test('buildTaskTree groups tasks and omits empty groups', () => {
		const tasks = [
			makeTask('build-app', { group: vscode.TaskGroup.Build }),
			makeTask('run-tests', { group: vscode.TaskGroup.Test }),
			makeTask('lint'),
		];
		const tree = buildTaskTree(tasks, []);
		assert.strictEqual(tree.length, 3);
		assert.deepStrictEqual(
			tree.map(node => (node.kind === 'group' ? node.group : undefined)),
			['build', 'test', 'other'],
		);
	});

	test('buildTaskTree with groupBy "none" returns a flat alphabetical list', () => {
		const tasks = [
			makeTask('zeta', { group: vscode.TaskGroup.Build }),
			makeTask('alpha', { group: vscode.TaskGroup.Test }),
		];
		const tree = buildTaskTree(tasks, [], 'none');
		assert.deepStrictEqual(
			tree.map(node => (node.kind === 'task' ? node.task.name : undefined)),
			['alpha', 'zeta'],
		);
	});

	test('buildTaskTree adds a folder layer for multi-root workspaces', () => {
		const folderA = makeFolder('a');
		const folderB = makeFolder('b');
		const tasks = [
			makeTask('build-a', { group: vscode.TaskGroup.Build, scope: folderA }),
			makeTask('build-b', { group: vscode.TaskGroup.Build, scope: folderB }),
		];
		const tree = buildTaskTree(tasks, [folderA, folderB]);
		assert.strictEqual(tree.length, 2);
		assert.ok(tree.every(node => node.kind === 'folder'));
	});

	test('buildTaskTree omits folders with no matching tasks', () => {
		const folderA = makeFolder('a');
		const folderB = makeFolder('b');
		const tasks = [makeTask('build-a', { group: vscode.TaskGroup.Build, scope: folderA })];
		const tree = buildTaskTree(tasks, [folderA, folderB]);
		assert.strictEqual(tree.length, 1);
	});
});
