
import { GoogleGenAI, Type } from "@google/genai";
import { Asset, RiskLevel, OptimizationResult, Language, AIConfig } from "../types";

const getAIConfig = (): AIConfig => {
  const stored = localStorage.getItem('wealthglow_ai_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse AI config", e);
    }
  }
  return {
    provider: 'gemini',
    apiKey: '',
    model: '',
    useCustom: false
  };
};

export const optimizePortfolio = async (
  currentAssets: Asset[],
  years: number,
  annualWithdrawal: number,
  withdrawalIncreaseRate: number,
  language: Language
): Promise<OptimizationResult> => {
  const config = getAIConfig();
  const langContext = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currencyContext = language === 'zh' ? 'CNY (RMB)' : 'USD';

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
       - Use **tables** to compare "Before vs After" or "Asset Allocation".
       - Use headers (###), bullet points (-), and bold text (**) for readability.
       - Divide it into sections like "Current Status", "Risk Analysis", and "Recommendations".
       
       **JSON Structure Example**:
       {
         "analysis": "Markdown text here...",
         "suggestedPortfolio": [
           { "name": "Asset A", "riskLevel": "R3", "amount": 1000, "expectedReturnRate": 5.0 },
           ...
         ]
       }
  `;

  if (config.useCustom && config.provider === 'deepseek') {
    return callDeepSeek(prompt, config.apiKey, config.model || 'deepseek-chat', language);
  } else {
    // Default to Gemini (using internal key or custom key if provided)
    return callGemini(prompt, config.useCustom ? config.apiKey : (process.env.API_KEY || ''), config.model || "gemini-3-pro-preview", language);
  }
};

const callGemini = async (prompt: string, apiKey: string, model: string, language: Language): Promise<OptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey });
  const langContext = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      thinkingConfig: model.includes('pro') ? { thinkingBudget: 32768 } : undefined,
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

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");

  const result = JSON.parse(jsonText);
  return {
    analysis: result.analysis,
    suggestedPortfolio: result.suggestedPortfolio.map((item: any, index: number) => ({
      ...item,
      id: `suggested-${index}-${Date.now()}`
    }))
  };
};

const callDeepSeek = async (prompt: string, apiKey: string, model: string, language: Language): Promise<OptimizationResult> => {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "You are a senior financial portfolio manager. You must output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "DeepSeek API Error");
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return {
    analysis: result.analysis,
    suggestedPortfolio: (result.suggestedPortfolio || []).map((item: any, index: number) => ({
      ...item,
      id: `suggested-${index}-${Date.now()}`
    }))
  };
};
