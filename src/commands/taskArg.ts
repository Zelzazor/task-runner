import * as vscode from 'vscode';
import { TaskNode } from '../tree/treeNodes';

/**
 * Task-targeting commands are invoked either from a TreeItem's click
 * (argument is the raw TaskNode) or from a view/item/context menu entry
 * (VSCode also passes the raw TaskNode). Normalize both to the underlying
 * vscode.Task so callers don't need to care which path triggered them.
 */
function isTaskNode(arg: TaskNode | vscode.Task): arg is TaskNode {
	return (arg as TaskNode).kind === 'task';
}

export function resolveTaskArg(arg: TaskNode | vscode.Task): vscode.Task {
	return isTaskNode(arg) ? arg.task : arg;
}
