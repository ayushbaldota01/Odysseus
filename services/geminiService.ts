import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Flashcard, EmailAnalysisResult, BrainItem, DailyUpload, BrainCategory, Book } from '../types';

const apiKey = (import.meta.env?.VITE_API_KEY as string) ||
  (import.meta.env?.VITE_GEMINI_API_KEY as string) ||
  (typeof process !== 'undefined' ? process.env?.API_KEY : '') ||
  (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
  '';
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
    const systemInstruction = getDynamicPersona(projectContext, mode);

    // Construct conversation history with the new message
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] }
      },
      contents: contents
    });

    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Cofounder Chat Error:", error);
    if (!apiKey) {
      return "API Key missing. Please set VITE_API_KEY or GEMINI_API_KEY in your .env file.";
    }
    return "Connection error. Please try again.";
  }
};


export const summarizeLearningMaterial = async (text: string): Promise<{ summary: string, keyConcepts: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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

export const generateComprehensiveRoadmap = async (idea: string, qaHistory: { question: string, answer: string }[]): Promise<string> => {
  try {
    const qaContext = qaHistory.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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

export const processBrainDump = async (text: string): Promise<Array<{ category: BrainCategory, title: string, summary: string, keyInsights: string[], url?: string }>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `${AYUSH_PERSONA}
      
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
      
      Input: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['BOOK', 'PODCAST', 'VIDEO', 'ARTICLE', 'THREAD', 'TOOL', 'CONCEPT', 'OTHER'] },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    return [{ category: 'OTHER', title: 'New Entry', summary: text, keyInsights: [], url: undefined }];
  }
};

// --- Bookshelf ---

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Task: Create an immersive, condensed reading experience for "${title}" by ${author}.

Write this as if the reader is ACTUALLY READING an abridged version of the book. Make them FEEL like they're experiencing the book, not just reading a summary.

Format in Markdown:

# ${title}
*by ${author}*

---

## 🎬 The Opening
(Write 2-3 paragraphs that capture how the book begins. Set the scene. What's the hook? What problem or story does it introduce? Make it engaging like an actual book opening.)

---

## 📖 Part I: [Title of First Major Section/Theme]

### Chapter 1: [Chapter Title if known, or thematic title]
(Write 2-3 paragraphs summarizing this chapter's content in a narrative, engaging style. Include specific examples, stories, or arguments the author makes. Make it feel like reading the actual chapter condensed.)

### Chapter 2: [Chapter Title]
(Same approach - narrative, engaging, specific)

(Continue for major chapters/sections...)

---

## 📖 Part II: [Title of Second Major Section/Theme]
(Continue the chapter-by-chapter breakdown...)

---

## 📖 Part III: [If applicable]
(Continue...)

---

## 🎯 The Core Message
(2-3 paragraphs distilling the book's central thesis and why it matters)

---

## 💡 Actionable Takeaways
1. **[Takeaway 1]**: (How to apply it)
2. **[Takeaway 2]**: (How to apply it)
3. **[Takeaway 3]**: (How to apply it)
4. **[Takeaway 4]**: (How to apply it)
5. **[Takeaway 5]**: (How to apply it)

---

## 💬 Memorable Quotes
> "[Quote 1]"

> "[Quote 2]"

> "[Quote 3]"

---

## 🏁 The Closing
(How does the book end? What's the final message the author leaves with readers?)

---

**Reading Time**: ~X minutes (estimate based on summary length)
**Best For**: (Who should read this and when)

IMPORTANT: Write in a flowing, narrative style. The reader should feel like they've READ the book, not just skimmed a summary. Include specific stories, examples, and arguments from the book. If you don't know specific details, create a plausible structure based on the book's known themes.`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Book Summary Error:", error);
    return "Failed to generate book summary. Please try again.";
  }
};

// --- Content Deep Dive (Podcasts, Videos, etc.) ---

export const generateContentDeepDive = async (title: string, category: string, url?: string): Promise<string> => {
  try {
    const contentType = category.toLowerCase();

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Task: Create an immersive summary for this ${contentType}: "${title}"
${url ? `URL: ${url}` : ''}

Write this as if the reader is EXPERIENCING the actual ${contentType}. Make them feel like they watched/listened to it.

Format in Markdown:

# ${title}
*${category}*

---

## 🎬 Opening Hook
(What's the attention-grabbing start? Set the scene. What question or story does it open with?)

---

${contentType === 'podcast' ? `
## 🎙️ The Conversation Flow

### Part 1: The Setup (0:00 - ~15 min)
(What topics are introduced? What's the context? Who's speaking and what's their energy?)

### Part 2: The Deep Dive (~15 - 45 min)  
(The meat of the conversation. Key stories, insights, debates. Write it like you're listening along.)

### Part 3: The Breakthrough Moments (~45 min - end)
(The "aha" moments. The best insights. The memorable exchanges.)

---

## 💎 Golden Nuggets
(The 5-7 best quotes or insights from the conversation)

1. **"[Quote/Insight]"** - Context
2. **"[Quote/Insight]"** - Context
...

---

## 🎯 Key Themes Discussed
- **[Theme 1]**: Brief explanation
- **[Theme 2]**: Brief explanation
- **[Theme 3]**: Brief explanation

` : contentType === 'video' ? `
## 🎥 The Video Journey

### Opening Scene (0:00 - 2:00)
(How does it start? What visuals? What's said?)

### Main Content (~2:00 - middle)
(Walk through the key segments. What's shown? What's explained? Include specific examples and demonstrations.)

### The Climax/Key Reveal
(The main point or most impactful moment)

### Closing (~end)
(How does it wrap up? What's the call to action?)

---

## 💡 Key Points Covered
1. **[Point 1]**: Detailed explanation
2. **[Point 2]**: Detailed explanation
3. **[Point 3]**: Detailed explanation
...

---

## 🎯 Visual Highlights
(Describe any charts, demonstrations, or visual elements that were important)

` : `
## 📝 Content Breakdown

### Section 1: The Introduction
(What's the opening hook and context?)

### Section 2: The Core Content
(Main points, arguments, or story)

### Section 3: The Conclusion
(How does it end? What's the takeaway?)

---

## 💡 Key Insights
1. **[Insight 1]**
2. **[Insight 2]**
3. **[Insight 3]**

`}

## 🧠 What You'll Remember
(The 3 things that will stick with you after experiencing this content)

1. 
2. 
3. 

---

## ⚡ One-Line Summary
(If you had to describe this in one sentence to a friend)

---

**For**: (Who would benefit most from this content)
**Mood**: (What kind of vibe/energy does this content have)

IMPORTANT: Write engagingly. The reader should feel like they experienced the content, not just read about it.`,
    });
    return response.text || "Could not generate deep dive.";
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
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
