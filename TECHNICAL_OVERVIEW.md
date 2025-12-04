# Odysseus - Technical Overview

## For Co-founders & Technical Stakeholders

---

## 1. Project Overview

**Odysseus** is an AI-powered personal productivity companion designed specifically for engineering students. It integrates Google's Gemini AI to provide intelligent assistance across academics, project building, personal reflection, and knowledge management.

### Vision
To create the ultimate "second brain" for builders and engineers - a system that understands context, remembers everything, and actively helps users become world-class in their field.

### Core Philosophy
- **Direct & Actionable**: No fluff, just high-density information
- **Context-Aware**: AI understands the user's projects, tasks, and mindset
- **Builder-First**: Optimized for people who create, not just consume

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | React | 19.2.0 |
| **Language** | TypeScript | 5.8.2 |
| **Build Tool** | Vite | 6.2.0 |
| **AI SDK** | @google/genai | 1.30.0 |
| **Styling** | Tailwind CSS | CDN |
| **Icons** | Material Icons | Google Fonts CDN |

### Why These Choices?
- **React 19**: Latest features, concurrent rendering for smooth AI streaming
- **Vite**: Lightning-fast HMR, native ESM support, excellent DX
- **Gemini AI**: State-of-the-art reasoning, structured output, cost-effective
- **Tailwind**: Rapid UI development, consistent design system

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ODYSSEUS APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  App.tsx    │  │   Views     │  │  Services   │              │
│  │  (Router)   │──│  Components │──│  (AI Layer) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    State Management                          ││
│  │           (React useState + localStorage)                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
└──────────────────────────────│───────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Google Gemini API │
                    │   (gemini-2.5-flash)│
                    └─────────────────────┘
```

### Data Flow
1. User interacts with UI component
2. Component calls service function from `geminiService.ts`
3. Service constructs prompt with context + persona
4. Gemini API returns structured response
5. Response updates local state
6. State persists to localStorage automatically

---

## 4. File Structure

```
Odysseus-main/
├── index.html              # Entry HTML with Tailwind CDN
├── index.tsx               # React root mount
├── App.tsx                 # Main app component + routing
├── types.ts                # TypeScript interfaces
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies
├── .env.local              # API keys (gitignored)
│
├── components/
│   ├── AcademicsView.tsx   # Tasks, Notebook, Mail parser
│   ├── BuilderView.tsx     # Project management + AI tools
│   ├── ThoughtBookView.tsx # Journaling with AI reflection
│   ├── KnowledgeHub.tsx    # Second Brain + Daily Protocol
│   ├── FriendChat.tsx      # Main AI chat interface
│   └── VoiceInputButton.tsx# Speech-to-text input
│
└── services/
    └── geminiService.ts    # All Gemini AI integrations
```

---

## 5. Feature Breakdown

### 5.1 Academics View
**File**: `components/AcademicsView.tsx`

| Sub-Feature | Description | AI Function |
|-------------|-------------|-------------|
| Task Manager | CRUD for academic tasks (assignments, exams) | `generateSimpleHelp()` - AI Tutor |
| Notebook | Learning resource storage with AI summaries | `summarizeLearningMaterial()` |
| Study Guide | Auto-generated cheat sheets | `generateStudyGuide()` |
| Flashcards | Active recall cards from content | `generateFlashcards()` |
| Mail Parser | Extract deadlines from pasted emails | `analyzeInboxForAcademics()` |

### 5.2 Builder View
**File**: `components/BuilderView.tsx`

| Sub-Feature | Description | AI Function |
|-------------|-------------|-------------|
| Project Launchpad | Wizard for new project creation | `generateScopingQuestions()` |
| Roadmap Generator | Comprehensive execution plan | `generateComprehensiveRoadmap()` |
| AI Brainstorm | Technical idea generation | `generateProjectIdeas()` |
| Execution Plan | Phase-by-phase build plan | `generateProjectPlan()` |
| Feasibility Check | Critical engineering audit | `critiqueProjectFeasibility()` |
| Note System | Categorized project notes (Ideas, Plans, Research, Logs) | - |

### 5.3 Thought Book
**File**: `components/ThoughtBookView.tsx`

| Sub-Feature | Description | AI Function |
|-------------|-------------|-------------|
| Journal Entry | Free-form thought logging | - |
| AI Reflection | Instant analysis of entries | `analyzeJournal()` |
| Timeline View | Chronological thought history | - |

### 5.4 Knowledge Hub (Second Brain)
**File**: `components/KnowledgeHub.tsx`

| Sub-Feature | Description | AI Function |
|-------------|-------------|-------------|
| Daily Protocol | AI-curated daily learning topic | `generateDailyProtocol()` |
| Open Box | Dump links/ideas for AI categorization | `processBrainDump()` |
| Knowledge Stack | History of learned topics | - |

### 5.5 Friend Chat
**File**: `components/FriendChat.tsx`

| Sub-Feature | Description | AI Function |
|-------------|-------------|-------------|
| Conversational AI | Context-aware chat assistant | `generateDeepReflection()` |
| Voice Input | Speech-to-text messaging | Web Speech API |
| Text-to-Speech | Read AI responses aloud | Web Speech API |

---

## 6. AI Integration Details

### Gemini Service (`services/geminiService.ts`)

#### Model Used
- **Primary**: `gemini-2.5-flash` - Fast, cost-effective for all operations

#### Persona System
Every AI call includes the `AYUSH_PERSONA` prompt that defines:
- Communication style (direct, no fluff)
- Behavioral rules (challenge weak reasoning, push for mastery)
- Target identity (builder in engineering, AI, quant-tech)

#### Structured Outputs
Many functions use Gemini's JSON schema feature for type-safe responses:

```typescript
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
```

#### Context Injection
The `getContextPrompt()` function injects user context into AI calls:
- Current tasks and deadlines
- Active projects
- Recent journal entries
- Learning topics

---

## 7. State Management

### Approach
- **No external state library** - Uses React's `useState` with lazy initialization
- **Persistence**: All state auto-saves to `localStorage`

### State Slices
```typescript
interface AppState {
  userProfile: { name: string; major: string };
  tasks: AcademicTask[];
  projects: Project[];
  journal: JournalEntry[];
  resources: LearningResource[];
  brain: {
    inbox: BrainItem[];
    dailyUploads: DailyUpload[];
  };
}
```

### Persistence Pattern
```typescript
// Lazy load from localStorage
const [tasks, setTasks] = useState<AcademicTask[]>(() => {
  const saved = localStorage.getItem('app_tasks');
  return saved ? JSON.parse(saved) : [];
});

// Auto-save on change
useEffect(() => {
  localStorage.setItem('app_tasks', JSON.stringify(tasks));
}, [tasks]);
```

---

## 8. Running Locally

### Prerequisites
- Node.js 18+
- npm 9+
- Gemini API Key

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Create environment file
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |

---

## 9. Key Technical Decisions

### Why Client-Side Only?
- **Privacy**: All data stays in user's browser
- **Simplicity**: No backend to maintain
- **Cost**: No server costs, only API calls
- **Speed**: No network latency for data operations

### Why localStorage over IndexedDB?
- Simpler API for current data volume
- Synchronous access for instant state restoration
- Easy to debug and export

### Why Tailwind via CDN?
- Faster prototyping without build configuration
- Play CDN supports all utilities
- Trade-off: Slightly larger bundle, but acceptable for MVP

---

## 10. Future Roadmap Possibilities

### Near-Term
- [ ] Export/Import data (JSON backup)
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [ ] Markdown rendering in notes

### Medium-Term
- [ ] Cloud sync (Supabase/Firebase)
- [ ] Mobile PWA optimization
- [ ] Collaborative projects
- [ ] Calendar integration

### Long-Term
- [ ] Custom AI persona configuration
- [ ] Plugin system for extensions
- [ ] Desktop app (Electron/Tauri)
- [ ] API for third-party integrations

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API Key Exposure | Stored in `.env.local`, gitignored |
| Data Privacy | All data client-side, never sent to our servers |
| XSS | React's built-in escaping, no `dangerouslySetInnerHTML` |

---

## 12. Performance Notes

- **Initial Load**: ~500ms (Vite HMR)
- **AI Response Time**: 1-5s depending on complexity
- **localStorage Limit**: ~5MB (sufficient for text data)
- **No Virtualization**: Lists assumed <1000 items

---

*Document Version: 1.0*
*Last Updated: November 2024*

