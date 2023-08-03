import { gptApi } from './gpt-api';

function makeSystemPrompt(language: string, pattern: string, prompt: string): string {
  return `You are a senior developer at a software company working on a ${language} project. `
  + `A coworker asks your to review their code. Give them feedback and suggestions about the code quality and how performance can be improved considering ${pattern}. `
  + 'See the code below:';
}

export async function fetchGptCompletions(language: string, pattern: string, prompt: string): Promise<string | null> {
  try {
    const system = makeSystemPrompt(language, pattern, prompt);
    const { choices } = await gptApi.getCompletions('text-davinci-003', [`${system}\n\n${prompt}`]);
    return choices[0].text;

  } catch (error) {
    const message = (error as Error).message;
    return `Error fetching response from ChatGPT API: ${message}`;
  }
}
