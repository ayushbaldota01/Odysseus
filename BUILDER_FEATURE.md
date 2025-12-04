# Builder Feature - Deep Dive

## The Engineering Project Command Center

---

## Overview

The **Builder** feature is the heart of Odysseus - a dedicated workspace for engineering students to ideate, plan, execute, and document their projects with AI assistance at every step.

Unlike generic project management tools, Builder understands engineering workflows: research phases, prototyping, material constraints, and iterative testing.

---

## What Problem Does Builder Solve?

### The Typical Student Project Experience

1. **Idea Phase**: "I want to build something cool" → No structure, idea dies
2. **Planning Phase**: Rough sketch on paper → Missing critical details
3. **Execution Phase**: Start building → Hit unexpected roadblocks
4. **Documentation Phase**: "I should have written this down" → Knowledge lost

### The Builder Experience

1. **Idea Phase**: AI asks clarifying questions → Idea becomes actionable
2. **Planning Phase**: AI generates comprehensive roadmap → Nothing forgotten
3. **Execution Phase**: AI provides on-demand guidance → Roadblocks anticipated
4. **Documentation Phase**: Categorized notes auto-saved → Knowledge preserved

---

## Core Components

### 1. Project Dashboard

The main view shows all projects as cards with:
- Project title and description
- Current status (IDEA / IN_PROGRESS / ON_HOLD / COMPLETED)
- Note count and last activity date
- Quick visual scanning of project portfolio

### 2. Project Launchpad (AI Wizard)

A guided flow for creating new projects:

```
Step 1: INPUT_IDEA
  └── User describes project idea (text or voice)
  
Step 2: AI_QUESTIONING
  └── AI generates 3 critical clarifying questions
  
Step 3: USER_ANSWERING
  └── User answers each question (text or voice)
  
Step 4: GENERATING_PLAN
  └── AI creates comprehensive roadmap
  
Result: New project created with:
  └── Auto-generated title
  └── Full description
  └── Initial roadmap as first note (category: PLAN)
```

### 3. Project Workspace

When viewing a single project:
- **Header**: Title, editable description, status toggles
- **Note Categories**: Filter by Ideas, Plans, Research, Logs, General
- **Note Entry**: Add new notes with category selection + voice input
- **Note Feed**: Chronological list of all project entries
- **AI Panel**: Side panel with AI tools

### 4. Note Categories

| Category | Icon | Purpose | Color |
|----------|------|---------|-------|
| General | notes | Miscellaneous entries | Gray |
| Ideas | lightbulb | Brainstorms, concepts | Yellow |
| Plans | assignment | Execution steps, timelines | Cyan |
| Research | science | Findings, references | Purple |
| Logs | history_edu | Build progress, updates | Green |

---

## AI-Powered Features

### Feature 1: Project Ideation Wizard

**When Used**: Creating a new project

**How It Works**:
```
User Input: "I want to build a remote controlled lawn mower powered by solar panels"

AI Response (generateScopingQuestions):
1. "What's your budget constraint for this project?"
2. "What terrain will this operate on (flat lawn, slopes, rough ground)?"
3. "What's your timeline - competition deadline or personal project?"

User Answers: [Budget: $500, Terrain: Flat with some slopes, Timeline: 3 months]

AI Generates (generateComprehensiveRoadmap):
- Executive Brief
- Bill of Materials estimates
- Phase 1: R&D / Design
- Phase 2: Prototyping / MVP
- Phase 3: Testing / Iteration
- Kill Criteria (when to pivot/stop)
```

**AI Function**: `generateScopingQuestions()` + `generateComprehensiveRoadmap()`

**Technical Details**:
```typescript
// Scoping questions use structured JSON output
config: {
  responseMimeType: 'application/json',
  responseSchema: {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  }
}

// Roadmap uses markdown format with thinking time
config: {
  thinkingConfig: { thinkingBudget: 32768 }
}
```

---

### Feature 2: AI Brainstorm

**When Used**: Stuck on technical implementation

**How It Works**:
```
Context Sent to AI:
- Project title
- Project description
- Last 3 notes

AI Response: 3 high-level technical considerations
- Bullet points
- Concise engineering insights
- Innovation-focused
```

**AI Function**: `generateProjectIdeas()`

**Prompt Style**:
```
Role: Senior Chief Engineer (Musk/Zuck style)
Task: Brainstorm technical implementations
Goal: Impossible efficiency and innovation
```

**Example Output**:
```
• Consider brushless DC motors over brushed - 40% efficiency gain, 
  critical for solar power constraints
  
• Hub motors in wheels eliminate mechanical transmission losses - 
  fewer moving parts = higher reliability in outdoor conditions
  
• Implement geofencing via GPS module (NEO-6M) rather than 
  perimeter wire - removes installation barrier for users
```

---

### Feature 3: Execution Plan Generator

**When Used**: Need structured build phases

**How It Works**:
```
Context Sent to AI:
- Full project context

AI Response: Phase-by-phase execution plan
1. Specs (Research/Requirements)
2. Architecture (Design/CAD)
3. Logistics (Procurement)
4. Build (Fabrication)
5. Validation (Testing)
```

**AI Function**: `generateProjectPlan()`

**Example Output**:
```
## EXECUTION PLAN: Solar Lawn Mower

### Phase 1: SPECS (Week 1-2)
- Define cutting width requirement (18" recommended for efficiency)
- Calculate power budget: motors (200W) + controller (20W) + sensors (10W)
- Research local regulations for autonomous outdoor vehicles

### Phase 2: ARCHITECTURE (Week 2-3)
- CAD chassis design (recommend aluminum extrusion for modularity)
- Circuit schematic: solar panel → charge controller → battery → motor drivers
- Sensor placement diagram for obstacle avoidance

### Phase 3: LOGISTICS (Week 3-4)
- Source 100W solar panel (~$80)
- Order BLDC motors with encoders (~$60 x2)
- Procure LiFePO4 battery pack (~$150)

### Phase 4: BUILD (Week 4-8)
- Week 4-5: Chassis fabrication
- Week 6: Electrical integration
- Week 7: Software deployment
- Week 8: Assembly and initial testing

### Phase 5: VALIDATION (Week 8-12)
- Stress test: 4-hour continuous operation
- Safety test: obstacle detection response time <500ms
- Efficiency test: m² covered per Wh consumed
```

---

### Feature 4: Feasibility Critique

**When Used**: Reality check before heavy investment

**How It Works**:
```
Context Sent to AI:
- Full project context

AI Response: Critical engineering audit
- Destroys bad assumptions
- Identifies bottlenecks
- Checks physics and supply chain
- Brutally honest but constructive
```

**AI Function**: `critiqueProjectFeasibility()`

**Example Output**:
```
## FEASIBILITY AUDIT

### 🔴 CRITICAL ISSUES

**Power Budget Mismatch**
Your 100W solar panel won't sustain two 200W motors. Under ideal conditions 
(full sun, 6 peak hours), you generate 600Wh/day. Two motors at load consume 
400W continuous = 2400Wh for 6 hours of mowing. You're 4x short.

**Recommendation**: Either reduce to one motor (sacrifice speed) or increase 
to 400W solar array (sacrifice cost/weight).

### 🟡 CONCERNS

**Terrain Assumption**
You mentioned "some slopes" but didn't specify grade. Above 15° incline, 
standard hub motors lose traction. Need either:
- Tracked drive system (+$200, +5kg)
- Aggressive tire tread (+$40)

### 🟢 STRENGTHS

**Modular Chassis Choice**
Aluminum extrusion allows iterative modifications without re-fabrication. 
Smart choice for a prototype.

### VERDICT
Proceed with revised power budget. Current design will fail on day 1.
```

---

## User Workflow

### Workflow 1: Starting a New Project

```
1. Click "Launch New Project" on dashboard
2. Describe idea (type or voice)
3. Click "ANALYZE IDEA"
4. Answer AI's clarifying questions
5. Click "GENERATE BLUEPRINT"
6. Project created with roadmap
7. Begin execution with categorized notes
```

### Workflow 2: Daily Project Work

```
1. Select project from dashboard
2. Review existing notes (filter by category if needed)
3. Add new entry with appropriate category
4. If stuck → Use AI Brainstorm
5. If planning → Use Generate Plan
6. If uncertain → Use Feasibility Check
7. Save AI outputs to project notes
```

### Workflow 3: Project Review

```
1. Open project workspace
2. Filter to "Plans" to see all execution notes
3. Filter to "Logs" to see progress history
4. Filter to "Research" to review findings
5. Update project status as needed
```

---

## Technical Implementation

### State Machine (Wizard)

```typescript
type WizardState = 
  | 'IDLE'           // No wizard active
  | 'INPUT_IDEA'     // User typing idea
  | 'AI_QUESTIONING' // AI generating questions
  | 'USER_ANSWERING' // User answering questions
  | 'GENERATING_PLAN'; // AI creating roadmap
```

### Data Model

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  notes: ProjectNote[];
}

interface ProjectNote {
  id: string;
  content: string;
  category?: 'GENERAL' | 'IDEA' | 'PLAN' | 'RESEARCH' | 'LOG';
  createdAt: string;
}
```

### AI Context Construction

```typescript
const context = `
  Project: ${selectedProject.title}
  Description: ${selectedProject.description}
  Recent Notes: ${selectedProject.notes.slice(0,3).map(n => n.content).join('; ')}
`;
```

---

## AI Persona in Builder

The Builder AI adopts a specific persona:

```
Role: Senior Chief Engineer (Musk/Zuck style)
Characteristics:
- Thinks in first principles
- Challenges assumptions
- Focuses on execution, not theory
- Pushes for impossible efficiency
- Identifies failure points early
```

This persona ensures responses are:
- Actionable (not vague suggestions)
- Technical (engineering-specific language)
- Honest (points out flaws directly)
- Ambitious (pushes for innovation)

---

## Voice Input Integration

Every text input in Builder supports voice:

```typescript
<VoiceInputButton 
  onTranscript={(text) => setWizardIdea(prev => prev + ' ' + text)} 
  size="sm" 
/>
```

**Use Cases**:
- Dictate project ideas hands-free
- Answer wizard questions verbally
- Add notes while working on hardware

---

## Saving AI Responses

When AI generates output, users can save it to project notes:

```typescript
const saveAiResponse = () => {
  let category: NoteCategory = 'GENERAL';
  if (activeAiAction === 'BRAINSTORM') category = 'IDEA';
  if (activeAiAction === 'PLAN') category = 'PLAN';
  if (activeAiAction === 'CRITIQUE') category = 'RESEARCH';
  
  addNote(aiOutput, category);
};
```

This ensures AI outputs become permanent project documentation.

---

## Example Use Cases

### Use Case 1: Capstone Project

```
Scenario: Senior design project for drone delivery system

Builder Usage:
1. Use Launchpad to define project scope
2. AI generates comprehensive roadmap
3. Use Brainstorm for propulsion options
4. Use Feasibility Check before purchasing motors
5. Log weekly progress in Build Logs
6. Store research papers in Research notes
```

### Use Case 2: Personal Hobby Project

```
Scenario: Building a custom mechanical keyboard

Builder Usage:
1. Quick idea entry without full wizard
2. Brainstorm switch types and layouts
3. Generate procurement plan
4. Log assembly progress with photos (as text descriptions)
5. Document lessons learned for next build
```

### Use Case 3: Competition Prep

```
Scenario: Robotics competition in 2 months

Builder Usage:
1. Full wizard with timeline constraints
2. AI generates aggressive schedule
3. Feasibility check on proposed mechanism
4. Daily build logs for team sync
5. Research notes for judge Q&A prep
```

---

## Future Enhancements

### Planned
- [ ] Image uploads for visual documentation
- [ ] Gantt chart view of plans
- [ ] Cost tracking per project
- [ ] Team collaboration features

### Possible
- [ ] Integration with CAD software
- [ ] Bill of Materials auto-generation
- [ ] Supplier price comparison
- [ ] 3D model viewer

---

## Summary

The Builder feature transforms vague project ideas into structured, executable plans with AI guidance at every step. It's designed for students who want to **actually build things**, not just manage tasks.

**Key Differentiators**:
1. Engineering-specific AI persona
2. Structured ideation wizard
3. Categorized documentation system
4. On-demand technical guidance
5. Feasibility auditing before commitment

---

*"Ideas are cheap. Execution is everything. Builder helps you execute."*

---

*Document Version: 1.0*
*Last Updated: November 2024*

