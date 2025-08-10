import * as vscode from "vscode";
import { CoverageAnalysis } from "./helpers/coverageAnalyzer";
import { localize } from "./localization";

export function openCoveragePanel(context: vscode.ExtensionContext, analysis: CoverageAnalysis) {
  const panel = vscode.window.createWebviewPanel(
    "codeownersCoverage",
    "CODEOWNERS Coverage Analysis",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = getCoverageHTML(analysis);

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'openTeamGraph':
          vscode.commands.executeCommand('codeownersTeams.openGraph', message.team);
          return;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getCoverageHTML(analysis: CoverageAnalysis): string {
  const coverageColor = analysis.coveragePercentage >= 80 ? "#28a745" : 
                       analysis.coveragePercentage >= 60 ? "#ffc107" : "#dc3545";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CODEOWNERS Coverage Analysis</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            a {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background-color: var(--vscode-sideBar-background);
                border-radius: 8px;
            }
            .coverage-summary {
                display: flex;
                justify-content: space-around;
                margin-bottom: 30px;
            }
            .metric {
                text-align: center;
                padding: 20px;
                background-color: var(--vscode-sideBar-background);
                border-radius: 8px;
                min-width: 150px;
            }
            .metric-value {
                font-size: 2em;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .coverage-circle {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 1.5em;
                font-weight: bold;
                color: white;
                background: conic-gradient(${coverageColor} ${analysis.coveragePercentage * 3.6}deg, #e9ecef ${analysis.coveragePercentage * 3.6}deg);
            }
            .section {
                margin-bottom: 30px;
                background-color: var(--vscode-sideBar-background);
                border-radius: 8px;
                padding: 20px;
            }
            .section h3 {
                margin-top: 0;
                color: var(--vscode-editor-foreground);
                border-bottom: 2px solid var(--vscode-focusBorder);
                padding-bottom: 10px;
            }
            .directory-item, .filetype-item, .team-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                background-color: var(--vscode-editor-background);
                border-radius: 4px;
            }
            .progress-bar {
                width: 100px;
                height: 8px;
                background-color: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                transition: width 0.3s ease;
            }
            .progress-fill.high {
                background-color: #28a745; /* Green for high coverage (80%+) */
            }
            .progress-fill.medium {
                background-color: #ffc107; /* Yellow for medium coverage (60-79%) */
            }
            .progress-fill.low {
                background-color: #dc3545; /* Red for low coverage (<60%) */
            }
            .uncovered {
                color: #dc3545;
                font-weight: bold;
            }
            .covered {
                color: #28a745;
            }
            .timestamp {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-size: 0.9em;
                margin-top: 20px;
            }
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--vscode-descriptionForeground);
                background-color: var(--vscode-editor-background);
                border-radius: 4px;
                border: 2px dashed var(--vscode-focusBorder);
            }
            .empty-state p {
                margin: 0;
                font-size: 1.1em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${localize("📊 CODEOWNERS Coverage Analysis")}</h1>
            <div class="coverage-circle">
                ${analysis.coveragePercentage.toFixed(1)}%
            </div>
            <p>${localize("Overall Coverage")}</p>
        </div>

        <div class="coverage-summary">
            <div class="metric">
                <div class="metric-value">${analysis.totalFiles}</div>
                <div>${localize("Total Files")}</div>
            </div>
            <div class="metric">
                <div class="metric-value covered">${analysis.coveredFiles}</div>
                <div>${localize("Covered Files")}</div>
            </div>
            <div class="metric">
                <div class="metric-value uncovered">${analysis.totalFiles - analysis.coveredFiles}</div>
                <div>${localize("Uncovered Files")}</div>
            </div>
        </div>

        <div class="section">
            <h3>${localize("📁 Directories Needing Coverage")}</h3>
            ${analysis.uncoveredDirectories.filter(dir => dir.uncoveredFiles > 0).length > 0 ? 
                analysis.uncoveredDirectories.filter(dir => dir.uncoveredFiles > 0).map(dir => {
                    const coverageClass = dir.coveragePercentage >= 80 ? 'high' : 
                                         dir.coveragePercentage >= 60 ? 'medium' : 'low';
                    return `
                    <div class="directory-item">
                        <div>
                            <strong>${dir.path}</strong><br>
                            <small>${localize("{0} of {1} files uncovered").replace("{0}", dir.uncoveredFiles.toString()).replace("{1}", dir.totalFiles.toString())}</small>
                        </div>
                        <div>
                            <div class="progress-bar">
                                <div class="progress-fill ${coverageClass}" style="width: ${dir.coveragePercentage}%"></div>
                            </div>
                            <small>${dir.coveragePercentage.toFixed(1)}%</small>
                        </div>
                    </div>
                `;
                }).join('') :
                `<div class="empty-state">
                    <p>${localize("🎉 All directories are fully covered! No action needed.")}</p>
                </div>`
            }
        </div>

        <div class="section">
            <h3>${localize("📄 File Types Needing Coverage")}</h3>
            ${analysis.fileTypeCoverage.filter(type => type.uncoveredFiles > 0).length > 0 ? 
                analysis.fileTypeCoverage.filter(type => type.uncoveredFiles > 0).map(type => {
                    const coverageClass = type.coveragePercentage >= 80 ? 'high' : 
                                         type.coveragePercentage >= 60 ? 'medium' : 'low';
                    return `
                    <div class="filetype-item">
                        <div>
                            <strong>${type.extension}</strong><br>
                            <small>${localize("{0} of {1} files covered").replace("{0}", type.coveredFiles.toString()).replace("{1}", type.totalFiles.toString())}</small>
                        </div>
                        <div>
                            <div class="progress-bar">
                                <div class="progress-fill ${coverageClass}" style="width: ${type.coveragePercentage}%"></div>
                            </div>
                            <small>${type.coveragePercentage.toFixed(1)}%</small>
                        </div>
                    </div>
                `;
                }).join('') :
                `<div class="empty-state">
                    <p>${localize("🎉 All file types are fully covered! No action needed.")}</p>
                </div>`
            }
        </div>

        <div class="section">
            <h3>${localize("👥 Team Coverage Distribution")}</h3>
            ${analysis.teamCoverage.length > 0 ? 
                analysis.teamCoverage.map(team => `
                    <div class="team-item">
                        <div>
                            <strong><a href="#" onclick="openTeamGraph('${team.team}')" title="${localize("Click to view ownership graph for {0}").replace("{0}", team.team)}">${team.team}</a></strong><br>
                            <small>${localize("{0} files ({1}% of total)").replace("{0}", team.totalFiles.toString()).replace("{1}", team.percentageOfTotal.toFixed(1))}</small>
                        </div>
                    </div>
                `).join('') :
                `<div class="empty-state">
                    <p>${localize("No teams found in CODEOWNERS file.")}</p>
                </div>`
            }
        </div>

        <div class="timestamp">
            ${localize("Analysis completed: {0}").replace("{0}", analysis.scanDate.toLocaleString())}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            function openTeamGraph(teamName) {
                vscode.postMessage({
                    command: 'openTeamGraph',
                    team: teamName
                });
            }
        </script>
    </body>
    </html>
  `;
}
