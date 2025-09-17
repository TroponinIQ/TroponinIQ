# AI Coaching Engine: Complete Implementation Roadmap

This document provides a comprehensive, phased guide for evolving the current application into a proactive, stateful AI Coaching Engine with **Dashboard-First Experience**. It begins with an immediate, targeted fix for product information recall and then outlines a clear path to building the full, advanced coaching system with visual progress tracking as the primary interface.

---

## Phase 1: The Routing Foundation & Product Expert

**Goal:** To replace the current single-agent system with a stable, two-agent orchestrator that provides 100% reliable product information and continues to handle general FAQs, without altering the existing user data structure. This phase provides immediate business value and a safe branching point.

1.  **Create Structured Product Catalog:** Establish a definitive, non-VDB source of truth.
    *   **Files:** Modular product catalog system in `lib/db/product-catalog/`:
        *   `product-catalog-index.json` - Main routing and platform info
        *   `supplements.json` - Individual supplement products  
        *   `stacks.json` - Supplement stacks/bundles
        *   `books-programs.json` - Educational content
        *   `products-quick-ref.json` - Quick reference for AI agents
    *   **Action:** Create a modular catalog system with structured JSON files for optimal AI consumption. This eliminates VDB unreliability while allowing efficient, targeted data loading.

2.  **Install LangChain Dependencies:** Add the core libraries for the new architecture.
    *   **File:** `package.json`
    *   **Action:** Run `pnpm add langchain @langchain/langgraph @langchain/openai`.

3.  **Create New AI Engine Directories:** Establish a clean home for the new agentic logic.
    *   **Action:** Create `lib/ai/engine` (for the orchestrator) and `lib/ai/agents` (for specialized agents).

4.  **Build Product Catalog Agent:** Create a simple, highly reliable agent for product queries.
    *   **File:** `lib/ai/agents/product-agent.ts` (new file)
    *   **Action:** Implement the agent. Its primary tools will include functions that read and parse the modular catalog files in `lib/db/product-catalog/` for efficient product recommendations.

5.  **Isolate FAQ Agent:** Modularize the existing agent logic.
    *   **File:** `lib/ai/agents/faq-agent.ts` (new file)
    *   **Action:** Move the existing vector database query logic from `lib/ai/agent.ts` into this new file.

6.  **Build Core Orchestrator:** Implement the new routing "brain".
    *   **File:** `lib/ai/engine/orchestrator.ts` (new file)
    *   **Action:** Use LangGraph to build a graph with a **Router** that directs traffic to either the `Product Agent` or `FAQ Agent`.

7.  **Rewire API Endpoint:** Switch the live traffic over to the new system.
    *   **File:** `app/api/chat/route.ts`
    *   **Action:** Replace the current implementation with a call to the new orchestrator.

---
***(At this point, a new branch should be created for all subsequent phases.)***
---

## Phase 2: The Stateful Foundation & Dashboard Core

**Goal:** To introduce long-term memory, make the entire system aware of the user's individual context, and implement the foundational dashboard experience that will serve as the primary interface.

1.  **Define & Implement User Profile Schema:**
    *   **File:** `lib/db/types.ts` & Firestore Console
    *   **Action:** Define and implement the `UserProfile` schema with dashboard-optimized structure. Include: `userId`, `goals`, `physicalStats`, `preferences`, `injuryHistory`, `activityLog`, and `dashboardCache` for performance.

2.  **Implement User Onboarding:**
    *   **Route:** `app/(auth)/register/` or a new `/onboarding` route.
    *   **Action:** Create a comprehensive, multi-step form for new users to fill out their `UserProfile` data, emphasizing the visual benefits they'll see on their dashboard.

3.  **Build Dashboard Foundation:**
    *   **Route:** `app/dashboard/page.tsx` (new file)
    *   **Components:** Create `components/dashboard/` directory with core layout components
    *   **Action:** Implement the basic dashboard layout with navigation between chat and dashboard views, stats overview widgets, and responsive design.

4.  **Implement Performance Architecture:**
    *   **Dependencies:** Add `@tanstack/react-query` or `swr` for data caching
    *   **Action:** Set up caching layer for dashboard data, real-time Firestore listeners, and optimistic updates for instant feedback.

5.  **Enhance Orchestrator for Statefulness:**
    *   **File:** `lib/ai/engine/orchestrator.ts`
    *   **Action:** Modify the orchestrator's entry point to fetch the full `UserProfile` and pass it as state to all agents. Add dashboard context awareness.

6.  **Update Navigation & Routing:**
    *   **File:** `app/(chat)/layout.tsx` and `components/layout/app-sidebar.tsx`
    *   **Action:** Add dashboard navigation, update sidebar to include dashboard link, and ensure seamless transitions between interfaces.

---

## Phase 3: The Workout Specialist & Workout Dashboard

**Goal:** To build a world-class workout agent that understands both specific plans and general principles, adapts to user feedback, and provides comprehensive visual workout management through the dashboard.

1.  **Structure the Workout Knowledge:** A hybrid approach is critical for reliability and flexibility.
    *   **Structured Plans (JSON):** Create `lib/db/workout-plans.json`. This file will contain the precise, step-by-step templates for core programs like "Massive" and "Shredded".
        *   **Schema Example:** `{ "planName": "Massive", "phase": 1, "week": 1, "day": "Chest", "exercises": [{ "name": "Bench Press", "sets": 3, "reps": "8-10" }] }`
    *   **Unstructured Principles (Vector DB):** Create a new, dedicated vector database for workout *theory*.

2.  **Build the Workout Agent:**
    *   **File:** `lib/ai/agents/workout-agent.ts`
    *   **Action:** The agent will use a hybrid approach, retrieving structured JSON templates and using vector DB knowledge to explain the reasoning or modify plans based on user profiles.

3.  **Build Workout Dashboard Components:**
    *   **Components:** `components/dashboard/workout/` directory
    *   **Features:** Create workout plan display cards, exercise tracking widgets, progress visualization charts, and completion tracking interfaces.
    *   **Mobile Optimization:** Ensure all components work seamlessly on mobile for gym use.

4.  **Implement the Feedback Loop:**
    *   **Dashboard:** Add workout completion buttons with difficulty feedback directly in the dashboard
    *   **Chat Integration:** Allow users to ask specific questions about exercises from dashboard context
    *   **Data Flow:** Feedback saves to user's `activityLog` and influences future agent recommendations

5.  **Add Dashboard Quick Actions:**
    *   **Features:** "Ask about today's workout," "Generate new program," "How's my progress?" buttons
    *   **Context:** Each action provides relevant user data to the chat interface for intelligent responses

---

## Phase 4: The Nutrition Specialist & Nutrition Dashboard

**Goal:** To provide accurate nutritional data via external tools, wrap all advice in a layer of safety, and create comprehensive nutrition tracking through visual dashboard components.

1.  **Structure the Nutrition Knowledge:**
    *   **External Data (API Tool):** Create `lib/ai/tools/nutrition-api-tool.ts` for services like Nutritionix or Edamam.
    *   **Internal Principles (Vector DB):** Create a vector database for general nutritional science.

2.  **Build the Nutrition Agent:**
    *   **File:** `lib/ai/agents/nutrition-agent.ts`
    *   **Action:** Agent uses `NutritionApiTool` for specific data and vector DB for general questions.

3.  **Build Nutrition Dashboard Components:**
    *   **Components:** `components/dashboard/nutrition/` directory
    *   **Features:** Macro tracking widgets, daily nutrition goals with progress bars, meal plan displays, and calorie calculations
    *   **Real-time Updates:** Live macro tracking as users log meals or ask nutrition questions

4.  **Build the Shared Calculator Tool:**
    *   **File:** `lib/ai/tools/calculator-tool.ts`
    *   **Action:** Create tools for BMR, TDEE, and macro calculations that both agents and dashboard can use.

5.  **Implement the Safety & Validation Agent:**
    *   **File:** `lib/ai/agents/safety-agent.ts`
    *   **Action:** Rule-based agent that validates all plans against user profiles, with results displayed clearly in both dashboard and chat.

6.  **Integrate Nutrition & Workout Data:**
    *   **Dashboard:** Show relationship between workout performance and nutrition adherence
    *   **Insights:** AI-generated insights about patterns and correlations displayed prominently

---

## Phase 5: Proactive Coaching & Advanced Dashboard Features

**Goal:** To transform the app from a reactive tool into a proactive companion with advanced dashboard analytics and seamless chat integration.

1.  **Implement Proactive Check-ins:**
    *   **Backend:** `app/api/cron/checkin/route.ts` and scheduler configuration
    *   **Dashboard:** Real-time notification system for proactive messages, workout reminders, and progress celebrations
    *   **Smart Timing:** AI determines optimal times to reach out based on user patterns

2.  **Build Advanced Dashboard Analytics:**
    *   **Components:** Progress charts, trend analysis, goal tracking, body composition tracking
    *   **Performance:** Implement chart lazy loading, virtual scrolling for large datasets, and optimized re-renders
    *   **Insights:** AI-generated insights about progress patterns and recommendations

3.  **Enable Contextual Chat Integration:**
    *   **Feature:** Users can click any dashboard element to ask specific questions with full context
    *   **Examples:** "Why did my weight go up this week?" while viewing weight chart, "Modify today's workout" from workout card
    *   **Seamless Flow:** Chat opens with relevant context, maintains dashboard state

4.  **Build High-Value Tools:**
    *   **Export:** `lib/ai/tools/spreadsheet-generator-tool.ts` for downloading plans
    *   **Sharing:** Progress sharing features for accountability
    *   **Goals:** Advanced goal setting and milestone tracking

5.  **Optimize for Mobile Experience:**
    *   **PWA:** Implement Progressive Web App features for mobile installation
    *   **Offline:** Cache critical dashboard data for offline viewing
    *   **Performance:** Optimize load times and interactions for mobile usage

6.  **Build the Complete Profile Dashboard:**
    *   **Route:** Enhanced profile management with comprehensive progress overview
    *   **Features:** Progress photos, measurement tracking, achievement system, and data export options
