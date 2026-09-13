# task-runner

A tab in VS Code's Activity Bar that lists the tasks defined in your workspace's `.vscode/tasks.json` and lets you run them with one click — no Command Palette required. Aimed at developers used to IDE build/run buttons (Xcode, Android Studio) who want the same one-click workflow in VS Code.

## Features

- A dedicated Activity Bar view listing tasks explicitly defined in `tasks.json`, grouped into Build / Test / Other buckets.
- Click a task to run it immediately.
- Live status icons: spinner while running, checkmark on success, error icon on failure.
- An inline stop button to terminate a running task (e.g. a background/watch task).
- Right-click a task to reveal its entry in `tasks.json`, or use the toolbar button to open the file directly.
- Multi-root workspace support: tasks are grouped by folder when more than one root is open.
- An empty-state prompt to configure a task when the workspace doesn't have any yet.

## Requirements

No external dependencies or setup. The view works with any workspace that has a `.vscode/tasks.json`; if one doesn't exist yet, use the button shown in the empty state (or VS Code's own "Tasks: Configure Task" command) to create it.

## Extension Settings

This extension contributes the following settings:

* `task-runner.includeAutoDetected`: Also show tasks auto-detected by other providers (npm, gulp, etc.), not just tasks explicitly defined in `tasks.json`. Default: `false`.
* `task-runner.groupBy`: How tasks are grouped in the view — `"group"` (Build/Test/Other buckets) or `"none"` (flat alphabetical list). Default: `"group"`.
* `task-runner.showTaskType`: Show each task's type (e.g. `shell`, `npm`) next to its name. Default: `true`.

## Known Issues

None currently tracked.

## Release Notes

### 0.0.1

Initial release: Activity Bar view of `tasks.json` tasks, click-to-run, live run-state icons, a stop action, `tasks.json` navigation commands, and configurable grouping/filtering settings.
