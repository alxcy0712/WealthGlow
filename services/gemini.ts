
import { GoogleGenAI, Type } from "@google/genai";
import { Asset, RiskLevel, OptimizationResult, Language } from "../types";

export const optimizePortfolio = async (
  currentAssets: Asset[],
  years: number,
  annualWithdrawal: number,
  withdrawalIncreaseRate: number,
  language: Language
): Promise<OptimizationResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

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
    4. Provide the result in a structured JSON format. 
       **CRITICAL**: The 'analysis' field MUST be written in ${langContext} using **Markdown** formatting. 
       - Use **tables** to compare "Before vs After" or "Asset Allocation".
       - Use headers (###), bullet points (-), and bold text (**) for readability.
       - Divide it into sections like "Current Status", "Risk Analysis", and "Recommendations".
  `;

  // Upgraded to gemini-3-pro-preview with Thinking Mode for deeper financial analysis
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: `You are a senior financial portfolio manager specializing in asset allocation and risk management. You must communicate in ${langContext}. Your output must be structured and formatted with Markdown. Use Markdown Tables where appropriate for data comparison.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.STRING,
            description: `A detailed analysis in ${langContext} formatted in Markdown, ideally including tables.`
          },
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
  if (!jsonText) {
      throw new Error("No response from AI");
  }

  try {
      const result = JSON.parse(jsonText);
      // Map basic objects back to our Asset type (adding IDs if missing in AI response)
      const suggestedAssets: Asset[] = result.suggestedPortfolio.map((item: any, index: number) => ({
          ...item,
          id: `suggested-${index}-${Date.now()}`
      }));
      
      return {
          analysis: result.analysis,
          suggestedPortfolio: suggestedAssets
      };
  } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to parse AI optimization results.");
  }
};
