import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

const API_KEY = ''; // Replace this with your actual API key

export const gptApi = new OpenAIClient(
  'https://gptdeployment.openai.azure.com/',
  new AzureKeyCredential(API_KEY)
);
