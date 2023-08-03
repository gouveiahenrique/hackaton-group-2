import * as vscode from 'vscode';
import { fetchGptCompletions } from '../chat-gpt';

export async function reviewCodeCommand() {
  // The code you place here will be executed every time your command is executed
  // Display a message box to the user
  // vscode.window.showInformationMessage('Hello World from hackaton-group-2!');

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const userText = editor.document.getText();
    const languageId = 'TypeScript'; // vscode.window.activeTextEditor?.document.languageId; // e.g. typescript
    const pattern = 'Clean Code'; // ask user?

    const response = await fetchGptCompletions(languageId, pattern, userText);


    // Exiba a resposta do GPT em uma nova janela ou em um painel, conforme desejado.
    vscode.window.showInformationMessage(`Resposta do GPT: ${response}`);
  }
}
