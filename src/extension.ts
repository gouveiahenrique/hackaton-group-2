import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';


// Replace these with your ChatGPT API credentials
const API_KEY = '';
const API_ENDPOINT = 'https://gptdeployment.openai.azure.com/';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "codebuddy" is now active!');

	let debounceTimer: NodeJS.Timeout | undefined;
	let cache: { [code: string]: string[] } = {};

	const getCodeReviewSuggestions = async (code: string, chosenPattern: string): Promise<string[]> => {
		const client = new OpenAIClient(API_ENDPOINT, new AzureKeyCredential(API_KEY));
		const prompt =  [`as an experienced "${vscode.window.activeTextEditor?.document.languageId}" developer give your honest, detailed feedback using "${chosenPattern}" to talk about this code and if needed suggest improvements and corrections: ${code}`];
		console.log(prompt);
		try {
			const response = await client.getCompletions("text-davinci-003", prompt, { maxTokens: 200, temperature: 0.7, n: 2 });

			// Extract and return suggestions from the response
			const suggestions = response.choices.map((choice: any) => choice.text.trim());
			return suggestions;
		} catch (error) {
			console.error('Error requesting review suggestions:', error);
			throw error;
		}
	};

	const showReviewSuggestions = (suggestions: string[], editor: vscode.TextEditor) => {
		const suggestionQuickPickItems: vscode.QuickPickItem[] = suggestions.map((suggestion, index) => ({
			label: `Suggestion ${index + 1}`,
			description: suggestion,
		}));

		vscode.window.showQuickPick(suggestionQuickPickItems, {
			placeHolder: 'Select a suggestion to apply to the code',
		}).then(async (chosenSuggestion) => {
			if (chosenSuggestion) {
				const selectedCode = chosenSuggestion.description;
				// const edit = new vscode.WorkspaceEdit();
				// edit.replace(editor.document.uri, editor.selection, selectedCode ?? "");
				// await vscode.workspace.applyEdit(edit);
				// vscode.window.showInformationMessage('Suggestion applied successfully!');

				const fileName = `codebuddy_suggestion_${Date.now()}.txt`;

				// Get the system's temporary directory
				const tempDir = os.tmpdir();
				const tempFilePath = path.join(tempDir, fileName);

				// Write the selected suggestion to the temporary file
				fs.writeFileSync(tempFilePath, selectedCode ?? "");

				// Open the new temporary file
				const doc = await vscode.workspace.openTextDocument(tempFilePath);
				await vscode.window.showTextDocument(doc);

				// Open the compare view with the original code
				// vscode.commands.executeCommand('workbench.files.action.compareWith', doc.uri, editor.document.uri);
				await vscode.commands.executeCommand('selectForCompare', doc.uri)
				await vscode.commands.executeCommand('compareFiles', editor.document.uri);
    
				
			}
		});
	};

	const updateSuggestions = async (editor: vscode.TextEditor) => {
		const code = editor.document.getText();
		if (!code) {
			return;
		}

		const languageId = editor.document.languageId;
		const chosenPattern = await vscode.window.showQuickPick(
			['Clean Code', 'DRY', 'KISS', 'SOLID', 'YAGNI'],
			{
				placeHolder: 'Select code pattern for review',
			}
		);

		if (!chosenPattern) {
			return;
		}

		const cacheKey = `${code}-${chosenPattern}`;
		if (cache[cacheKey]) {
			showReviewSuggestions(cache[cacheKey], editor);
		} else {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				try {
					const suggestions = await getCodeReviewSuggestions(code, chosenPattern);
					cache[cacheKey] = suggestions;
					showReviewSuggestions(suggestions, editor);
				} catch (error) {
					vscode.window.showErrorMessage('Failed to get review suggestions.');
					console.error(error);
				}
			}, 500);
		}
	};

	context.subscriptions.push(vscode.commands.registerCommand('codebuddy.reviewCode', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor.');
			return;
		}

		updateSuggestions(editor);
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('codebuddy.reviewCodeFromContextMenu', async (uri: vscode.Uri) => {
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document);

			updateSuggestions(editor);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
