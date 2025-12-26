
// Fix: Added LearningResource to imports.
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Flashcard, EmailAnalysisResult, BrainItem, DailyUpload, BrainCategory, LearningResource } from '../types';

// Fix: Always use process.env.API_KEY directly in the named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AYUSH_PERSONA = `
SYSTEM IDENTITY: ODYSSEUS ELITE COUNCIL (0.01% High Agency)
You are Ayush's high-intelligence digital companion. Your goal is to help him excel in Mechanical Engineering and manage complex builds.

OPERATIONAL PROTOCOLS:
1. FIRST PRINCIPLES ONLY: Strip every idea down to its fundamental truths.
2. HIGH AGENCY: Proactively identify bottlenecks and push for 10x thinking.
3. ELITE EXECUTION: Treat Ayush as a future world-class builder. 

TONE: Sharp, technical, strategic, and high-signal.
`;

const CO_ENGINEER_PROMPT = `
ROLE: LEAD SYSTEMS ENGINEER (0.01% ELITE)
Expertise: Mechanical systems, thermodynamics, control theory, and industrial design.
Objective: Solve hardware/software bottlenecks with extreme precision. 
Standard: Aerospace-grade reliability and efficiency.
`;

const RESEARCH_AGENT_PROMPT = `
ROLE: PRINCIPAL RESEARCHER (0.01% ELITE)
Expertise: First-principles market fit, competitive teardowns, and material feasibility.
Objective: Uncover hidden risks and identify the highest leverage technical opportunities.
Standard: Academic rigor combined with venture speed.
`;

export const callAgent = async (agent: 'ENGINEER' | 'RESEARCHER', prompt: string, context: string): Promise<string> => {
  try {
    const systemPrompt = agent === 'ENGINEER' ? CO_ENGINEER_PROMPT : RESEARCH_AGENT_PROMPT;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      ${systemPrompt}
      Current Project Context: ${context}
      User Query: ${prompt}`,
      config: { thinkingConfig: { thinkingBudget: 16384 } }
    });
    return response.text || "Agent logic loop failed.";
  } catch (error) {
    return "Agent connection severed.";
  }
};

const getContextPrompt = (state: AppState): string => {
  const recentTasks = state.tasks.filter(t => !t.completed).slice(0, 5).map(t => `${t.title} (${t.subject})`).join(', ');
  const activeProjects = state.projects.filter(p => p.status === 'IN_PROGRESS').map(p => p.title).join(', ');
  const learningTopics = state.resources.slice(0, 3).map(r => r.title).join(', ');

  return `
    Mission Status:
    - Active Builds: ${activeProjects || "None currently"}
    - Pending Tasks: ${recentTasks || "All caught up"}
    - Knowledge Base: ${learningTopics || "Ready to learn"}
  `;
};

export const generateSimpleHelp = async (prompt: string, context?: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${AYUSH_PERSONA}
      ${context ? `Context: ${context}` : ''}
      Query: ${prompt}`,
    });
    return response.text || "I'm having trouble connecting to my core logic.";
  } catch (error) {
    return "Connection error.";
  }
};

export const generateDeepReflection = async (prompt: string, state: AppState): Promise<string> => {
  try {
    const contextData = getContextPrompt(state);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Context: ${contextData}
      Objective: Provide deep strategic insight.
      
      User Message: ${prompt}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    return response.text || "My reasoning cycles were interrupted.";
  } catch (error) {
    return "The system is momentarily overloaded.";
  }
};

export const analyzeJournal = async (entry: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${AYUSH_PERSONA}
      Analyze entry. Brief reflection (max 30 words).
      Entry: "${entry}"`,
    });
    return response.text || "Logged and noted.";
  } catch (error) {
    return "Logged.";
  }
};

export const generateProjectIdeas = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Project: ${projectContext}
      Provide 3 high-leverage 0.01% strategic moves or features.`,
      config: { thinkingConfig: { thinkingBudget: 8192 } }
    });
    return response.text || "Idea generation failed.";
  } catch (error) {
    return "Error.";
  }
};

export const generateProjectPlan = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Task: Execution Map.
      Target: ${projectContext}`,
      config: { thinkingConfig: { thinkingBudget: 16384 } }
    });
    return response.text || "Plan generation failed.";
  } catch (error) {
    return "Error.";
  }
};

export const critiqueProjectFeasibility = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Brutal Feasibility Audit. Identify the point of failure for: ${projectContext}`,
      config: { thinkingConfig: { thinkingBudget: 16384 } }
    });
    return response.text || "Critique failed.";
  } catch (error) {
    return "Error.";
  }
};

export const generateScopingQuestions = async (initialIdea: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      New idea: "${initialIdea}".
      Ask 3 fundamental, simple questions to isolate the MVP.
      Return JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["What is the core problem?", "Who is the primary user?", "What is the single failure point?"];
  }
};

export const generateInitialWhiteboard = async (idea: string, qaHistory: {question: string, answer: string}[]): Promise<string> => {
  try {
    const qaContext = qaHistory.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Generate Project Whiteboard.
      Idea: ${idea}
      Answers: ${qaContext}`,
      config: { thinkingConfig: { thinkingBudget: 8192 } }
    });
    return response.text || "Failed.";
  } catch (error) {
    return "Error.";
  }
};

export const generateProactiveQuestion = async (whiteboard: string, recentNotes: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${AYUSH_PERSONA}
            Ask ONE focused question based on:
            Whiteboard: ${whiteboard}
            Recent: ${recentNotes}`,
        });
        return response.text || "What's the next milestone?";
    } catch (e) {
        return "Next step?";
    }
};

export const updateWhiteboardWithAnswer = async (currentWhiteboard: string, question: string, answer: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${AYUSH_PERSONA}
            Update whiteboard.
            Current: ${currentWhiteboard}
            Q: ${question} | A: ${answer}`,
            config: { thinkingConfig: { thinkingBudget: 8192 } }
        });
        return response.text || currentWhiteboard;
    } catch (e) {
        return currentWhiteboard;
    }
};

export const processBrainDump = async (text: string): Promise<Array<{ category: BrainCategory, title: string, summary: string, url?: string }>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${AYUSH_PERSONA}
      Organize: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['READ', 'WATCH', 'TOOL', 'CONCEPT', 'OTHER'] },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              url: { type: Type.STRING, nullable: true }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [{ category: 'OTHER', title: 'New Entry', summary: text }];
  }
};

export const generateDailyProtocol = async (alreadyLearned: string[]): Promise<Omit<DailyUpload, 'id' | 'date' | 'completed'>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${AYUSH_PERSONA}
      Daily Protocol Generation. Avoid: ${alreadyLearned.join(', ')}.`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            topic: { type: Type.STRING },
            content: { type: Type.STRING },
            actionableResource: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { niche: 'General', topic: 'Error', content: 'Failed.', actionableResource: 'Retry' };
  }
};

export const analyzeStudyMaterials = async (text: string): Promise<Partial<LearningResource>> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${AYUSH_PERSONA}
        Analyze materials: "${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
              flashcards: { type: Type.ARRAY, items: { 
                type: Type.OBJECT,
                properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                }
              }}
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
        return { title: 'Analysis Failed', summary: 'Error.' };
    }
};

export const analyzeEmailsForTasks = async (emailText: string): Promise<EmailAnalysisResult> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${AYUSH_PERSONA}
        Scan emails: "${emailText}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              importantEmails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                    actionItem: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['EXAM', 'ASSIGNMENT', 'STUDY'] },
                        dueDate: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{"importantEmails":[]}');
    } catch (e) {
        return { importantEmails: [] };
    }
};
