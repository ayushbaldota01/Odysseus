
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Flashcard, EmailAnalysisResult, BrainItem, DailyUpload, BrainCategory } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const AYUSH_PERSONA = `
SYSTEM IDENTITY & BEHAVIOR PROTOCOLS:
1. AYUSH’S THINKING STYLE:
- He thinks fast and moves fast.
- He switches between big vision and hardcore execution.
- He prefers short, clean, distilled answers.
- He wants direct truth — no padding, no validation, no softening.
- He respects logic, speed, and practical steps over vague theory.
- Inspired by: Elon Musk (deep technical mastery), Mark Zuckerberg (product obsession), and Quant finance founders (precision).

2. RESPONSE STYLE:
- Match his energy: Clear, Conversational, Slightly intense, Focused on progress.
- Default: Short sentences. Direct answers. Clean structure. Always actionable. Never rambling.
- Core Job: Challenge weak reasoning. Expose blind spots. Dissect bad assumptions. Point out wasted time.
- Push him toward mastery in engineering, coding, AI, and finance.

3. BEHAVIOR RULES:
- Main Goal: Help him become a world-class builder in engineering, AI, and quant-tech.
- When he shares an idea: Refine it, sharpen it, stress-test it.
- When he’s confused: Cut through noise, give clarity.
- When he wastes time: Call it out directly.
- When he aims low: Tell him he’s aiming low and show the better route.
`;

// Helper to format context for the AI
const getContextPrompt = (state: AppState): string => {
  const recentTasks = state.tasks.filter(t => !t.completed).slice(0, 5).map(t => `${t.title} (${t.subject}) due ${t.dueDate}`).join(', ');
  const activeProjects = state.projects.filter(p => p.status === 'IN_PROGRESS').map(p => p.title).join(', ');
  const recentThought = state.journal.slice(0, 1).map(j => j.content).join(' ');
  const learningTopics = state.resources.slice(0, 3).map(r => r.title).join(', ');

  return `
    User Context:
    - Identity: Mechanical Engineering Student & Builder
    - Critical Deadlines: ${recentTasks || "None pending"}
    - Current Focus: ${learningTopics || "None recorded"}
    - Active Builds: ${activeProjects || "None active"}
    - Recent Headspace: "${recentThought || "No recent entries"}"
  `;
};

export const generateSimpleHelp = async (prompt: string, context?: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Academic Strategist. 
      Task: Provide a rapid, high-density technical breakdown or strategy. No fluff.
      ${context ? `Context: ${context}` : ''}
      
      Query: ${prompt}`,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Flash Error:", error);
    return "System glitch. Try again.";
  }
};

export const generateDeepReflection = async (prompt: string, state: AppState): Promise<string> => {
  try {
    const contextData = getContextPrompt(state);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      You are his Digital Reflection and Second Brain.
      ${contextData}
      
      He is asking for advice, brainstorming, or reflection.
      Think deeply about his trajectory as a world-class builder.
      
      User Query: ${prompt}`,
    });
    return response.text || "Thinking process stalled.";
  } catch (error) {
    console.error("Gemini Pro Thinking Error:", error);
    return "Thinking interrupted. Retry.";
  }
};

export const analyzeJournal = async (entry: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Analyze this thought log.
      If he is complaining, challenge him. If he is winning, push for the next level. 
      Keep it to 1-2 sentences. Sharp and direct.
      
      Entry: "${entry}"`,
    });
    return response.text || "Reflecting...";
  } catch (error) {
    return "Analysis unavailable.";
  }
};

export const generateProjectIdeas = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Senior Chief Engineer (Musk/Zuck style).
      Task: Brainstorm technical implementations. Aim for impossible efficiency and innovation.
      
      Project: ${projectContext}
      
      Output: 3 high-level technical considerations. Bullet points. Concise.`,
    });
    return response.text || "Brainstorming failed.";
  } catch (error) {
    return "Could not generate ideas.";
  }
};

export const generateProjectPlan = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Product Manager / Lead Engineer.
      Task: Create a ruthless execution plan.
      Structure: 
      1. Specs (Research/Reqs)
      2. Architecture (Design/CAD)
      3. Logistics (Procurement)
      4. Build (Fabrication)
      5. Validation (Testing)
      
      Project: ${projectContext}`,
    });
    return response.text || "Planning failed.";
  } catch (error) {
    return "Plan generation failed.";
  }
};

export const critiqueProjectFeasibility = async (projectContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Critical Engineering Audit.
      Task: Destroy bad assumptions. Identify bottlenecks. Check physics and supply chain.
      Be constructive but brutally honest.
      
      Project: ${projectContext}`,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    return "Critique failed.";
  }
};

// --- NotebookLM-style Learning Features ---

export const summarizeLearningMaterial = async (text: string): Promise<{summary: string, keyConcepts: string[]}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Task: Distill this engineering material.
      1. "Briefing": Max 3 sentences. High signal-to-noise ratio.
      2. "Key Concepts": Extract 3-5 core technical keywords (JSON).
      
      Text: "${text.substring(0, 10000)}"`, 
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return {
        summary: result.summary || "Summary unavailable.",
        keyConcepts: result.keyConcepts || []
    };
  } catch (error) {
    console.error(error);
    return { summary: "Could not summarize.", keyConcepts: [] };
  }
};

// --- Interactive Project Ideation Wizard ---

export const generateScopingQuestions = async (initialIdea: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      He has a project idea: "${initialIdea}".
      Task: Ask 3 critical, clarifying technical questions to determine if this is viable or if he's missing the point.
      Return JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    const questions = JSON.parse(response.text || "[]");
    return questions;
  } catch (error) {
    return ["What are the physics constraints?", "What is the MVP timeline?", "Where is the failure point?"];
  }
};

export const generateComprehensiveRoadmap = async (idea: string, qaHistory: {question: string, answer: string}[]): Promise<string> => {
  try {
    const qaContext = qaHistory.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Master Builder.
      Task: Create a "Zero to Hero" execution roadmap.
      
      Idea: ${idea}
      Context: ${qaContext}
      
      Format: Markdown.
      Sections:
      1. Executive Brief (The "Why" and "What")
      2. BOM Estimates (Hardware/Software)
      3. Phase 1: R&D / Design
      4. Phase 2: Prototyping / MVP
      5. Phase 3: Testing / Iteration
      6. Kill Criteria (When to pivot/stop)
      
      Tone: Technical, precise, inspiring.`,
    });
    return response.text || "Roadmap generation failed.";
  } catch (error) {
    return "Planning process failed.";
  }
};

// --- Study Tools & Mail ---

export const generateStudyGuide = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Exam Prep Strategist.
      Task: Convert this raw material into a high-velocity Cheat Sheet / Study Guide.
      Format: Markdown (Headers, Bullet points, Formulas).
      Focus: What is actually going to be on the exam. Key definitions. Core formulas.
      
      Content: ${content.substring(0, 15000)}`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 }
      }
    });
    return response.text || "Study guide generation failed.";
  } catch (error) {
    return "Could not generate study guide.";
  }
};

export const generateFlashcards = async (content: string): Promise<Flashcard[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Task: Create 5-8 active recall flashcards from this material.
      Focus: Hard technical concepts, not fluff.
      
      Content: ${content.substring(0, 10000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The question or concept" },
              back: { type: Type.STRING, description: "The answer or explanation" }
            }
          }
        }
      }
    });
    
    const cards = JSON.parse(response.text || "[]");
    return cards.map((c: any, i: number) => ({
      id: Date.now().toString() + i,
      front: c.front,
      back: c.back
    }));
  } catch (error) {
    return [];
  }
};

export const analyzeInboxForAcademics = async (emailText: string): Promise<EmailAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Task: Scan this raw email dump from ayush.baldota24@vit.edu.
      Goal: Extract exams, assignments, and critical academic announcements.
      Ignore: Newsletters, spam, general updates.
      
      Emails:
      ${emailText.substring(0, 20000)}`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 },
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
                    nullable: true,
                    properties: {
                      title: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['EXAM', 'ASSIGNMENT', 'STUDY'] },
                      dueDate: { type: Type.STRING, description: "YYYY-MM-DD format if possible, else string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"importantEmails": []}');
  } catch (error) {
    console.error(error);
    return { importantEmails: [] };
  }
};

// --- Second Brain / Knowledge Hub ---

export const processBrainDump = async (text: string): Promise<Array<{ category: BrainCategory, title: string, summary: string, url?: string }>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Task: Analyze this raw input for the Open Box of Thoughts (Second Brain).
      It may contain a single item or multiple items (a list of links, books, or ideas).
      
      For EACH distinct item found in the input:
      1. Categorize it: READ (book/article/newsletter), WATCH (video/channel), TOOL (software/ai/app), CONCEPT (idea/fact), OTHER.
      2. Extract a clean Title.
      3. Write a 1-sentence summary of what it is.
      4. If there is a URL, extract it.
      
      Input: "${text}"`,
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

    const result = JSON.parse(response.text || '[]');
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    // Fallback for error or if model returns a single object despite schema
    return [{ category: 'OTHER', title: 'New Entry', summary: text, url: undefined }];
  }
};

export const generateDailyProtocol = async (
  alreadyLearned: string[], 
  preferences: string = "AI, Tech, Philosophy, Automotive, Finance, Engineering, Science, Space Tech"
): Promise<Omit<DailyUpload, 'id' | 'date' | 'completed'>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AYUSH_PERSONA}
      
      Role: Knowledge Architect.
      Task: Generate TODAY'S "Daily Upgrade" protocol.
      Interests: ${preferences}.
      
      Constraints:
      1. Pick ONE niche randomly from the list.
      2. Select a specific, high-value, advanced concept (not beginner trivia).
      3. Content Format: Use Markdown with headers (###), bullet points, and bold text. Structure it cleanly: "The Concept", "Why It Matters", "Application".
      4. Provide one actionable thing to search or read to go deeper.
      
      Avoid these recent topics: ${alreadyLearned.join(', ')}.`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            niche: { type: Type.STRING },
            topic: { type: Type.STRING },
            content: { type: Type.STRING },
            actionableResource: { type: Type.STRING, description: "A valid URL if possible, or a search term" }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { niche: 'General', topic: 'System Error', content: 'Could not retrieve daily download.', actionableResource: 'Retry' };
  }
};
