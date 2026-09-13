# task-runner

A tab in VS Code's Activity Bar that lists the tasks defined in your workspace's `.vscode/tasks.json` and lets you run them with one click — no Command Palette required. Aimed at developers used to IDE build/run buttons (Xcode, Android Studio) who want the same one-click workflow in VS Code.

## Features

- A dedicated Activity Bar view listing tasks explicitly defined in `tasks.json`, grouped into Build / Test / Other buckets (plus any custom groups you define).
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
* `task-runner.groupBy`: How tasks are grouped in the view — `"group"` (Build/Test/Other buckets, plus any custom groups) or `"none"` (flat alphabetical list). Default: `"group"`.
* `task-runner.showTaskType`: Show each task's type (e.g. `shell`, `npm`) next to its name. Default: `true`.

### Custom groups

Add a `"task-runner.group"` property under a task's `options` in `tasks.json` to put it in its own bucket instead of Build/Test/Other:

```jsonc
{
  "label": "Deploy",
  "type": "shell",
  "command": "./deploy.sh",
  "options": {
    "task-runner.group": "Deploy"
  }
}
```

It goes under `options` rather than at the top level because VS Code's tasks.json schema rejects unrecognized top-level properties (you'd get a red squiggly) but explicitly allows arbitrary ones under `options`. Custom buckets are sorted alphabetically after Build/Test/Other. This is a `task-runner`-specific property (VS Code itself ignores it, and it isn't passed to the task's environment) — it takes priority over the task's own `"group"` field for classification purposes, but doesn't affect VS Code's own build/test task handling (e.g. `Ctrl+Shift+B`).

## Known Issues

None currently tracked.

## Release Notes

### 0.0.1

Initial release: Activity Bar view of `tasks.json` tasks, click-to-run, live run-state icons, a stop action, `tasks.json` navigation commands, and configurable grouping/filtering settings.
