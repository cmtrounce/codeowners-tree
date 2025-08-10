import * as vscode from "vscode";
import { localize } from "../localization";

export function showNoGraphvizMessage() {
    vscode.window.showWarningMessage(
        localize("Application graphviz need to be installed, please check the README.md")
    );
}
