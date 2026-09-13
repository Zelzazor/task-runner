import * as assert from 'assert';
import { TaskSource } from '../tasks/taskSource';

suite('TaskSource integration', () => {
	test('fetches tasks explicitly defined in the fixture workspace tasks.json', async () => {
		const taskSource = new TaskSource();
		try {
			const tasks = await taskSource.getTasks();
			const names = tasks.map(task => task.name).sort();
			assert.deepStrictEqual(names, ['Build App', 'Run Tests']);
			assert.ok(tasks.every(task => task.source === 'Workspace'));
		} finally {
			taskSource.dispose();
		}
	});
});
