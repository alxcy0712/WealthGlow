
import { GoogleGenAI, Type } from "@google/genai";
import { Asset, RiskLevel, OptimizationResult, Language, AIConfig } from "../types";

// AIConfig is now imported from types.ts to avoid duplication and fix dependency errors.

export const optimizePortfolio = async (
  currentAssets: Asset[],
  years: number,
  annualWithdrawal: number,
  withdrawalIncreaseRate: number,
  language: Language
): Promise<OptimizationResult> => {
  const langContext = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currencyContext = language === 'zh' ? 'CNY (RMB)' : 'USD';

  // Load config from localStorage
  const stored = localStorage.getItem('wealthglow_ai_config');
  let config: AIConfig | null = null;
  if (stored) {
    try {
      config = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse AI config", e);
    }
  }

  const prompt = `
    I have an investment portfolio that I want to optimize.
    
    Context:
    - Language for analysis: ${langContext}
    - Currency: ${currencyContext}
    
    Current Portfolio Data:
    ${JSON.stringify(currentAssets, null, 2)}
    
    Parameters:
    - Investment Horizon: ${years} years
    - Initial Annual Withdrawal Desired: ${annualWithdrawal} units
    - Annual Withdrawal Increase Rate: ${withdrawalIncreaseRate}% (Inflation/Lifestyle adjustment)
    
    Task:
    1. Analyze the current portfolio's risk and potential sustainability given the withdrawal rate and its annual increase.
    2. Suggest a modified portfolio structure (add/remove/edit assets) to better achieve stable growth while surviving the increasing withdrawals.
    3. Ensure the Total Principal of the suggested portfolio matches the Total Principal of the current portfolio.
    4. Provide the result in a structured JSON format with two fields: 'analysis' (Markdown string) and 'suggestedPortfolio' (Array of asset objects).
       
       **CRITICAL**: The 'analysis' field MUST be written in ${langContext} using **Markdown** formatting. 
       - Use **tables** to compare "Before vs After".
       - Use headers (###), bullet points (-), and bold text (**) for readability.
       
       **JSON Structure Example**:
       {
         "analysis": "Markdown text here...",
         "suggestedPortfolio": [
           { "name": "Asset A", "riskLevel": "R3", "amount": 1000, "expectedReturnRate": 5.0 },
           ...
         ]
       }
  `;

  if (config?.useCustom) {
    if (config.provider === 'deepseek') {
      return callOpenAICompatible(prompt, 'https://api.deepseek.com/v1/chat/completions', config.apiKey, config.model || 'deepseek-chat', language);
    } else if (config.provider === 'siliconflow') {
      return callOpenAICompatible(prompt, 'https://api.siliconflow.cn/v1/chat/completions', config.apiKey, config.model || 'deepseek-ai/DeepSeek-V3', language);
    }
  }

  // Default or Custom Gemini
  return callGemini(prompt, language, config?.useCustom ? config.apiKey : undefined, config?.useCustom ? config.model : undefined);
};

// Use the @google/genai SDK to generate optimized portfolio suggestions
const callGemini = async (prompt: string, language: Language, customKey?: string, customModel?: string): Promise<OptimizationResult> => {
  // Initialize AI client with the provided API key (preferring environment variable as primary source)
  const apiKey = customKey || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const modelName = customModel || 'gemini-3-pro-preview';
  const langContext = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: `You are a senior financial portfolio manager. You must communicate in ${langContext}. Output MUST be JSON with 'analysis' and 'suggestedPortfolio' fields.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          suggestedPortfolio: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
                amount: { type: Type.NUMBER },
                expectedReturnRate: { type: Type.NUMBER }
              },
              required: ["name", "riskLevel", "amount", "expectedReturnRate"]
            }
          }
        },
        required: ["analysis", "suggestedPortfolio"]
      }
    }
  });

  // Extract the generated JSON string from the response
  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from Gemini");

  const result = JSON.parse(jsonText);
  return {
    analysis: result.analysis,
    suggestedPortfolio: (result.suggestedPortfolio || []).map((item: any, index: number) => ({
      ...item,
      id: `suggested-${index}-${Date.now()}`
    }))
  };
};

const callOpenAICompatible = async (prompt: string, url: string, apiKey: string, model: string, language: Language): Promise<OptimizationResult> => {
  const langContext = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: `You are a senior financial portfolio manager. You must communicate in ${langContext}. Output MUST be valid JSON with 'analysis' and 'suggestedPortfolio' fields.` },
        { role: "user", content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `AI API Error: ${response.status}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    analysis: result.analysis,
    suggestedPortfolio: (result.suggestedPortfolio || []).map((item: any, index: number) => ({
      ...item,
      id: `suggested-ai-${index}-${Date.now()}`
    }))
  };
};
