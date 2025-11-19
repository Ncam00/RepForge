# RepForge
A modern fitness tracker built to forge progress, one rep at a time.

## Overview

A fitness application designed to streamline training, track progress, and visualize performance trends. The app focuses on simplicity, personalization, and data-driven insights.

## Core Features

### 1. Weight Tracking

* Log body weight daily or weekly.
* Compare weight changes across custom date ranges.
* Visual charts to track long-term trends.

### 2. Training Splits

* Create and customize training splits (Push/Pull/Legs, Upper/Lower, Bro Split, etc.).
* Assign workouts to specific days.
* Reuse templates for efficiency.

### 3. Exercises

* Define exercises with weight, reps, and rest time.
* Each exercise includes:

  * Demonstration video
  * Targeted muscle groups
  * Optional tips for proper form

### 4. Session History

* View past sessions for each exercise.
* Compare performance across sessions.
* Identify improvements and plateaus.

## Additional Helpful Features

* **Progressive overload suggestions** based on past performance.
* **Exercise library** with filters (muscle, equipment, difficulty).
* **Rest timer** integrated during workouts.
* **Personal records tracking** (1RM, volume records).
* **Workout notes** for logging mood, energy level, injuries, etc.
* **Sync across devices** with cloud storage.
* **Dark mode** for gym environments.
* **Offline mode** to continue workouts without internet.

## Tech Considerations

* Modular architecture for scalability.
* Video hosting and caching strategies.
* Local database for offline access.
* Authentication and user profile system.

## Installation & Setup

### Prerequisites

* Node.js (LTS recommended)
* Git
* VSCode with recommended extensions:

  * ESLint
  * Prettier
  * Markdown Preview Enhanced

### Getting Started

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start development server:

   ```bash
   npm run dev
   ```
4. Open project in VSCode:

   ```bash
   code .
   ```

## Roadmap

| Feature                          | Description                    | Priority | Version | Status       |
| -------------------------------- | ------------------------------ | -------- | ------- | ------------ |
| Weight Tracking                  | Graphs, comparisons, analytics | High     | v1.0    | ✅ Complete  |
| Training Splits                  | Customizable routines          | High     | v1.0    | ✅ Complete  |
| Exercise Library                 | Videos, muscles, tips          | High     | v1.1    | ✅ Complete  |
| Session History                  | Past session comparisons       | High     | v1.1    | 🚧 In Progress |
| PR Tracking                      | Auto PR detection              | Medium   | v1.2    | 📋 Planned   |
| Progressive Overload Suggestions | Smart recommendations          | Medium   | v1.3    | 📋 Planned   |
| Nutrition Tracking               | Meals, macros                  | Low      | v2.0    | 📋 Planned   |
| Community Challenges             | Social features                | Low      | v2.1    | 📋 Planned   |

* Add nutrition tracking.
* Include community challenges.
* Build customizable widgets for quick progress overview.
* Create analytics dashboard (volume over time, top exercises, etc.).
