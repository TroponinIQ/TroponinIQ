# Project Plan: AI Coaching Architecture

## 1. Project Vision: From Chatbot to AI Coach Dashboard

This document outlines the strategy for transforming the application from a reactive, single-agent chatbot into a **proactive, stateful AI Coaching Engine with Dashboard-First Experience**. The goal is to create a deeply personalized and adaptive user experience that goes beyond answering questions to actively participating in the user's fitness journey through both intelligent conversation and visual progress tracking.

The core of this evolution is the **Stateful User Profile** paired with a **Performance-Optimized Dashboard** - a persistent, long-term memory store for each user's goals, history, and preferences that feeds into both conversational AI and visual progress interfaces. This enables the system to move from superficial, stateless interactions to a continuous, context-aware coaching relationship displayed through both chat and dashboard interfaces.

The architecture will be orchestrated by **LangChain's LangGraph** and will feature a suite of specialized agents. The entire system is designed to be decoupled and modular, preventing vendor lock-in and allowing for future expansion. **The dashboard serves as the primary interface**, with chat supporting and enhancing the visual experience.

┌─ Sidebar ──────┐ ┌─ Main Dashboard ─────────────────────────┐
│ • Quick Actions │ │ ┌─ Stats Overview ─┐ ┌─ Active Plans ─┐ │
│ • Chat History  │ │ │ Current: 185 lbs │ │ Week 3, Day 2  │ │
│ • Coach Alerts  │ │ │ Goal: 175 lbs    │ │ Chest & Tris   │ │
│ • Profile       │ │ │ Progress: -10lbs │ │ 5 exercises    │ │
└─────────────────┘ │ └─────────────────┘ └───────────────┘ │
                    │ ┌─ Progress Charts ─┐ ┌─ Nutrition ──┐ │
                    │ │ Weight Trend      │ │ 2,200 cals   │ │
                    │ │ [Chart Display]   │ │ 180g protein │ │
                    │ └─────────────────┘ └───────────────┘ │
                    │ ┌─ Coach Messages ──────────────────┐ │
                    │ │ "Ready for today's workout? 💪"   │ │
                    └─────────────────────────────────────────┘

---

## 2. Core Architectural Pillars

1.  **Stateful User Profile:** A persistent Firestore document for each user, tracking goals, biometrics, workout/nutrition history, preferences, and feedback. This is the "biographical memory" of the AI coach.
2.  **Dashboard-First Experience:** A performance-optimized dashboard that visualizes progress, displays active plans, and provides quick access to AI coaching features. Chat becomes a supporting interface for detailed conversations.
3.  **Proactive Coaching Loop:** Using scheduled functions, the system will initiate conversations, offer encouragement, and provide timely advice based on the user's profile and recent activity, displayed in both dashboard alerts and chat messages.
4.  **Multi-Agent System:** A LangGraph-based orchestrator will route tasks to specialized agents (Nutrition, Workout, etc.) that are all enriched with the context from the Stateful User Profile.
5.  **Feedback & Adaptation:** A closed-loop system where user feedback on workouts and meal plans is captured through both dashboard interactions and chat, used by the agents to adapt and improve future recommendations.
6.  **Safety & Validation Layer:** A dedicated, rule-based agent that reviews all generated plans for safety and sensibility before they reach the user, building trust and minimizing risk.

---