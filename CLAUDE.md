# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A VS Code extension (`task-runner`) that adds an Activity Bar tab listing the tasks defined in a workspace's `.vscode/tasks.json`, so they can be run with one click instead of going through the Command Palette. Built with TypeScript + esbuild on the standard `generator-code` scaffold.

## Commands

```bash
npm run watch          # esbuild --watch + tsc --watch in parallel (used by the default build task / F5)
npm run compile        # check-types + lint + esbuild (one-shot)
npm run package        # check-types + lint + esbuild --production (minified, no sourcemap)
npm run check-types    # tsc --noEmit
npm run lint           # eslint src
npm test               # compiles tests + the extension, lints, then runs the suite in a real VS Code instance
```

- **Debugging/manual testing**: press F5 (uses `.vscode/launch.json`'s "Run Extension" config) to open an Extension Development Host with this extension loaded. `preLaunchTask` builds via `watch` first.
- **Running a single test**: there's no built-in single-test filter wired up; `npm test` runs the whole suite via `@vscode/test-cli` (`vscode-test`), which is configured in `.vscode-test.mjs` to compile `src/test/**/*.test.ts` → `out/test/**/*.test.js` and run them in a downloaded VS Code instance. To scope to one file/suite, pass mocha's `--grep` through the CLI (`npx vscode-test --grep "<name>"`) or temporarily edit `files` in `.vscode-test.mjs`.
- **Test workspace**: `npm test` opens `src/test/fixtures/sample-workspace` as the workspace folder (configured in `.vscode-test.mjs`), which has its own `.vscode/tasks.json` fixture used by the integration test.
- The first `npm test` run downloads a full VS Code build into `.vscode-test/` (gitignored) — this takes a while and needs network access the first time.

## Architecture

The extension is organized into three feature folders under `src/`, wired together in `src/extension.ts` (the composition root):

- **`src/tasks/`** — everything about *what tasks exist and their run state*, independent of how they're displayed.
  - `taskSource.ts`: the `TaskSource` class wraps `vscode.tasks.fetchTasks()`, filtered down to tasks whose `source === 'Workspace'` (i.e. tasks literally defined in a `tasks.json`, not npm/gulp/etc. auto-detected ones) unless `task-runner.includeAutoDetected` is on. Results are cached until `refresh()` is called, which happens on a `.vscode/tasks.json` file-watcher event or a `task-runner.*` settings change. There is **no** `vscode.tasks.onDidChangeTasks` event in the API — the file watcher is the only automatic invalidation signal.
  - `taskExecutionTracker.ts`: tracks live run state (`running` / `success` / `failure`) per task by subscribing once to `vscode.tasks.onDidStartTask` / `onDidEndTaskProcess` / `onDidEndTask`. `onDidEndTask` exists specifically as a fallback for `CustomExecution` tasks, which never fire `onDidEndTaskProcess`.
  - `taskKey.ts`: `vscode.Task` objects returned by `fetchTasks()` are **not reference-stable** across calls, so both the tracker and the tree provider correlate the same logical task via a composite string key (`source::scopeUri::name`) instead of object identity.
  - `taskScope.ts`: a shared `isWorkspaceFolder()` type guard for narrowing `Task.scope`, used by both `tasks/` and `tree/`.

- **`src/tree/`** — the `TreeDataProvider` and pure node-building logic for the sidebar view.
  - `treeNodes.ts`: pure functions (`buildTaskTree`, `classifyTask`) with no `vscode.TreeItem` dependency, so they're testable without an Extension Host beyond constructing plain `vscode.Task`/`WorkspaceFolder` values. Builds a tree of `FolderNode → (GroupNode | TaskNode)`: the folder layer only appears when `workspace.workspaceFolders.length > 1`; groups are Build/Test/Other (Clean and Rebuild fold into Build) unless `task-runner.groupBy` is `"none"`, which yields a flat alphabetical list instead.
  - `icons.ts`: pure state → `ThemeIcon` lookup (group icons, and idle/running/success/failure task icons), kept separate from the provider so icon rules aren't buried in rendering logic.
  - `taskTreeDataProvider.ts`: the actual `vscode.TreeDataProvider`. Maintains a `TaskKey → TaskNode` index (rebuilt each time `getChildren(undefined)` runs) so that a run-state change from `TaskExecutionTracker` can fire a **targeted** `onDidChangeTreeData` for just that row instead of re-rendering the whole tree.

- **`src/commands/`** — one file per registered command (`refresh`, `runTask`, `terminateTask`, `openTasksJson`, `revealTaskInJson`), aggregated by `index.ts`'s `registerCommands()`. Task-targeting commands can be invoked either by clicking a tree row or via its context menu, and VS Code passes different argument shapes for each path — `taskArg.ts`'s `resolveTaskArg()` normalizes a `TaskNode | vscode.Task` argument to a plain `vscode.Task` so command handlers don't need to care which path triggered them.

- **`src/settings.ts`** — reads/watches the `task-runner.*` configuration section (`includeAutoDetected`, `groupBy`, `showTaskType`). Not part of `tasks/` or `tree/` since both depend on it.

Module boundary: `tasks/` and `tree/` don't reach into each other's internals beyond the shared `taskKey.ts` key format and the plain `vscode.Task` / tree-node data passed across the boundary — `extension.ts` is the only place a `TaskSource` instance gets wired into both the tree provider and the command handlers.

### View contribution

The sidebar is contributed in `package.json` via `viewsContainers.activitybar` (id `taskRunner`, icon `resources/activity-bar-icon.svg`) and `views.taskRunner` (view id `taskRunner.tasksView`). Command ids use the `task-runner.*` dotted namespace; view/container ids use `taskRunner*` camelCase. No `activationEvents` are declared — `contributes.views`/`contributes.commands` imply activation automatically on the targeted engine version (`^1.137.0`). An empty-state `viewsWelcome` entry (gated on a `taskRunner.hasTasks` context key set from `extension.ts`) points users at VS Code's built-in `workbench.action.tasks.configureTaskRunner` command when no tasks exist yet.
