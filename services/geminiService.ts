import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, Flashcard, EmailAnalysisResult, BrainItem, DailyUpload, BrainCategory, Book } from '../types';

// Robust API Key Retrieval
const getApiKey = (): string => {
  // 1. Check Standard Vite Env
  if ((import.meta as any).env?.VITE_API_KEY) return (import.meta as any).env.VITE_API_KEY;

  // 2. Check Custom Prefix (enabled via vite.config.ts envPrefix)
  if ((import.meta as any).env?.GEMINI_API_KEY) return (import.meta as any).env.GEMINI_API_KEY;

  // 3. Check process.env (polyfilled by vite.config.ts define)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
  }

  console.error("CRITICAL: Gemini API Key is missing. Checked VITE_API_KEY and GEMINI_API_KEY in import.meta.env and process.env");
  return '';
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to get model - Centralized configuration
const getModel = (modelName: string = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

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
    const model = getModel();
    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Academic Strategist. 
      Task: Provide a rapid, high-density technical breakdown or strategy. No fluff.
      ${context ? `Context: ${context}` : ''}
      
      Query: ${prompt}`);
    return result.response.text() || "No response generated.";
  } catch (error) {
    console.error("Gemini Flash Error:", error);
    return "System glitch. Try again.";
  }
};
return "Analysis unavailable.";
  }
};

export const generateProjectIdeas = async (projectContext: string): Promise<string> => {
  try {
    const model = getModel();
    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Senior Chief Engineer (Musk/Zuck style).
      Task: Brainstorm technical implementations. Aim for impossible efficiency and innovation.
      
      Project: ${projectContext}
      
      Output: 3 high-level technical considerations. Bullet points. Concise.`);
    return result.response.text() || "Brainstorming failed.";
  } catch (error) {
    return "Could not generate ideas.";
  }
};

export const generateProjectPlan = async (projectContext: string): Promise<string> => {
  try {
    const model = getModel();
    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Product Manager / Lead Engineer.
      Task: Create a ruthless execution plan.
      Structure: 
      1. Specs (Research/Reqs)
      2. Architecture (Design/CAD)
      3. Logistics (Procurement)
      4. Build (Fabrication)
      5. Validation (Testing)
      
      Project: ${projectContext}`);
    return result.response.text() || "Planning failed.";
  } catch (error) {
    return "Plan generation failed.";
  }
};

export const critiqueProjectFeasibility = async (projectContext: string): Promise<string> => {
  try {
    const model = getModel();
    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Critical Engineering Audit.
      Task: Destroy bad assumptions. Identify bottlenecks. Check physics and supply chain.
      Be constructive but brutally honest.
      
      Project: ${projectContext}`);
    return result.response.text() || "Analysis failed.";
  } catch (error) {
    return "Critique failed.";
  }
};


// --- AI Cofounder & Builder Features ---

const getDynamicPersona = (projectDescription: string, mode: 'CHAT' | 'PLAN' | 'RESEARCH'): string => {
  const basePersona = `
    ROLE: You are the AI Co-Founder and Chief Technology Officer for the user's project.
    
    THE USER'S STYLE:
    - The user wants freedom. Do not be prescriptivist unless asked.
    - Adapt to their personality. If they are brief, be brief. If they are detailed, be detailed.
    - Your goal is to be the "Top 1% Expert" in the specific niche of the project.
    
    PROJECT CONTEXT: "${projectDescription}"
    
    YOUR EXPERTISE:
    - You must instantly adopt the persona of the world's leading expert in this specific field (e.g., if it's a drone, you are a master aeronautical engineer; if it's a crypto app, you are a master solidity dev and economist).
    - You have deep technical knowledge, business acumen, and strategic foresight in this niche.
  `;

  if (mode === 'PLAN') {
    return `${basePersona}
      CURRENT MODE: PLANNING
      - Focus on execution roadmaps, architectural decisions, and listing steps.
      - Help the user structure their thoughts into actionable plans.
      - Output should be structured (bullet points, checklists) when appropriate.
    `;
  }

  if (mode === 'RESEARCH') {
    return `${basePersona}
      CURRENT MODE: RESEARCH
      - Focus on feasibility, market analysis, competitor analysis, and technical validation.
      - Be critical but constructive. Spot bottlenecks and "gotchas" early.
      - Provide data-backed insights where possible.
    `;
  }

  // mode === 'CHAT' (General)
  return `${basePersona}
    CURRENT MODE: GENERAL DISCUSSION
    - Brainstorm, discuss ideas, and follow the user's lead.
    - Be a sounding board. Ask insightful questions only when it helps clarify the vision, but don't interrogate.
  `;
};

export const chatWithCofounder = async (
  message: string,
  history: { role: 'user' | 'model', parts: [{ text: string }] }[],
  projectContext: string,
  mode: 'CHAT' | 'PLAN' | 'RESEARCH'
): Promise<string> => {
  try {
    if (!apiKey) {
      console.warn("Attempted to chat without API key");
      return "API Key missing. Please check your .env file and ensure VITE_API_KEY is set.";
    }

    const systemInstruction = getDynamicPersona(projectContext, mode);

    // Using gemini-1.5-flash which supports system instructions nicely
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Valid role mapping for standard SDK might theoretically differ, but 'user'/'model' is standard
    // However, the startChat history requires precise format.
    // parts: [{text: ...}] is correct for @google/generative-ai

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text() || "I'm having trouble thinking right now.";
  } catch (error: any) {
    console.error("Cofounder Chat Error:", error);

    if (error.toString().includes("API key")) {
      return "Invalid API Key detected. Please verify your credentials.";
    }

    return `Connection error: ${error.message || 'Unknown error'}. Please try again.`;
  }
};


export const summarizeLearningMaterial = async (text: string): Promise<{ summary: string, keyConcepts: string[] }> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Task: Distill this engineering material.
      1. "Briefing": Max 3 sentences. High signal-to-noise ratio.
      2. "Key Concepts": Extract 3-5 core technical keywords (JSON).
      
      Text: "${text.substring(0, 10000)}"`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson || "{}");

    return {
      summary: parsed.summary || "Summary unavailable.",
      keyConcepts: parsed.keyConcepts || []
    };
  } catch (error) {
    console.error(error);
    return { summary: "Could not summarize.", keyConcepts: [] };
  }
};

// --- Interactive Project Ideation Wizard ---

export const generateScopingQuestions = async (initialIdea: string): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      He has a project idea: "${initialIdea}".
      Task: Ask 3 critical, clarifying technical questions to determine if this is viable or if he's missing the point.
      Return JSON array of strings.`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson || "[]");
  } catch (error) {
    return ["What are the physics constraints?", "What is the MVP timeline?", "Where is the failure point?"];
  }
};

export const generateComprehensiveRoadmap = async (idea: string, qaHistory: { question: string, answer: string }[]): Promise<string> => {
  try {
    const qaContext = qaHistory.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n');
    const model = getModel();

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
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
      
      Tone: Technical, precise, inspiring.`);

    return result.response.text() || "Roadmap generation failed.";
  } catch (error) {
    return "Planning process failed.";
  }
};

// --- Study Tools & Mail ---

export const generateStudyGuide = async (content: string): Promise<string> => {
  try {
    const model = getModel();
    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Exam Prep Strategist.
      Task: Convert this raw material into a high-velocity Cheat Sheet / Study Guide.
      Format: Markdown (Headers, Bullet points, Formulas).
      Focus: What is actually going to be on the exam. Key definitions. Core formulas.
      
      Content: ${content.substring(0, 15000)}`);

    return result.response.text() || "Study guide generation failed.";
  } catch (error) {
    return "Could not generate study guide.";
  }
};

export const generateFlashcards = async (content: string): Promise<Flashcard[]> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Task: Create 5-8 active recall flashcards from this material.
      Focus: Hard technical concepts, not fluff.
      
      Content: ${content.substring(0, 10000)}`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    const cards = JSON.parse(cleanJson || "[]");
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
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Task: Scan this raw email dump from ayush.baldota24@vit.edu.
      Goal: Extract exams, assignments, and critical academic announcements.
      Ignore: Newsletters, spam, general updates.
      
      Emails:
      ${emailText.substring(0, 20000)}`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson || '{"importantEmails": []}');
  } catch (error) {
    console.error(error);
    return { importantEmails: [] };
  }
};

// --- Second Brain / Knowledge Hub ---

export const processBrainDump = async (text: string): Promise<Array<{ category: BrainCategory, title: string, summary: string, keyInsights: string[], url?: string }>> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Task: Analyze this raw input for the Second Brain knowledge system.
      It may contain a single item or multiple items (links, podcasts, reels, articles, ideas).
      
      For EACH distinct item found in the input:
      1. Categorize it:
         - BOOK: Book titles, Goodreads links, reading lists
         - PODCAST: Spotify, Apple Podcasts, podcast episodes
         - VIDEO: YouTube, Instagram Reels, TikTok, video content
         - ARTICLE: Blog posts, news articles, newsletters
         - THREAD: Twitter/X threads, Reddit posts
         - TOOL: Software, apps, AI tools, websites
         - CONCEPT: Ideas, facts, quotes, mental models
         - OTHER: Anything else
      2. Extract a clean Title.
      3. Write a 2-3 sentence summary explaining what it is and why it's valuable.
      4. Extract 3-5 key insights or takeaways as bullet points.
      5. If there is a URL, extract it.
      
      Input: "${text}"`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson || '[]');
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [{ category: 'OTHER', title: 'New Entry', summary: text, keyInsights: [], url: undefined }];
  }
};

// --- Bookshelf ---

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const model = getModel();
    const result = await model.generateContent(`Task: Create an immersive, condensed reading experience for "${title}" by ${author}.

Write this as if the reader is ACTUALLY READING an abridged version of the book. Make them FEEL like they're experiencing the book, not just reading a summary.

Format in Markdown:

# ${title}
*by ${author}*

---

## 🎬 The Opening
(Write 2-3 paragraphs that capture how the book begins.)

---

## 🎯 The Core Message
(2-3 paragraphs distilling the book's central thesis)

---

## 💡 Actionable Takeaways
1. **[Takeaway 1]**: (How to apply it)
...

IMPORTANT: Write in a flowing, narrative style.`);

    return result.response.text() || "Could not generate summary.";
  } catch (error) {
    console.error("Book Summary Error:", error);
    return "Failed to generate book summary. Please try again.";
  }
};

// --- Content Deep Dive (Podcasts, Videos, etc.) ---

export const generateContentDeepDive = async (title: string, category: string, url?: string): Promise<string> => {
  try {
    const model = getModel();
    const contentType = category.toLowerCase();

    const result = await model.generateContent(`Task: Create an immersive summary for this ${contentType}: "${title}"
${url ? `URL: ${url}` : ''}

Write this as if the reader is EXPERIENCING the actual ${contentType}. Make them feel like they watched/listened to it.`);

    return result.response.text() || "Could not generate deep dive.";
  } catch (error) {
    console.error("Content Deep Dive Error:", error);
    return "Failed to generate content summary. Please try again.";
  }
};

export const generateDailyProtocol = async (
  alreadyLearned: string[],
  preferences: string = "AI, Tech, Philosophy, Automotive, Finance, Engineering, Science, Space Tech"
): Promise<Omit<DailyUpload, 'id' | 'date' | 'completed'>> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(`${AYUSH_PERSONA}
      
      Role: Knowledge Architect.
      Task: Generate TODAY'S "Daily Upgrade" protocol.
      Interests: ${preferences}.
      
      Constraints:
      1. Pick ONE niche randomly from the list.
      2. Select a specific, high-value, advanced concept (not beginner trivia).
      3. Content Format: Use Markdown with headers (###), bullet points, and bold text. Structure it cleanly: "The Concept", "Why It Matters", "Application".
      4. Provide one actionable thing to search or read to go deeper.
      
      Avoid these recent topics: ${alreadyLearned.join(', ')}.`);

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson || '{}');
  } catch (error) {
    return { niche: 'General', topic: 'System Error', content: 'Could not retrieve daily download.', actionableResource: 'Retry' };
  }
};
