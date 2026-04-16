# FlowPilot v1 - Implementation Plan

## 1. Project Goal

FlowPilot v1 is a deterministic event-driven UI Step State Machine SDK.

It helps guide users through web workflows by:
- Highlighting UI elements
- Tracking user actions
- Advancing step-by-step workflows
- Recovering from mismatches

NOT an automation tool, NOT an agent system.

---

## 2. System Architecture

### Core Principle

Only ONE runtime engine controls all flow transitions.

```
User Action
↓
Behavior Listener (event normalization only)
↓
EventBus
↓
Runtime Engine (single decision maker)
↓
Recovery Layer (optional fallback)
↓
Adapter Layer (read + render only)
````

---

## 3. Folder Structure (MANDATORY)

src/
  core/
    step.ts
    workflow.ts
    types.ts

  runtime/
    engine.ts        # ONLY entry point
    state.ts
    eventBus.ts
    lifecycle.ts

  behavior/
    listener.ts      # event normalization ONLY

  adapter/
    dom.ts           # read + render ONLY

  recovery/
    validator.ts
    recovery.ts
    reconcile.ts

---

## 4. Step Model (STRICT)

Step is PURE CONFIG ONLY.

```ts
type Step = {
  id: string;
  type: "click" | "form" | "route";
  highlight: string;
  desc?: string;
};
````

### Forbidden in Step:

* state
* status
* behavior
* autoNext
* runtime logic

---

## 5. Runtime Engine (CORE RULE)

engine.ts is the ONLY decision maker.

Responsibilities:

* Receive events
* Evaluate current step
* Transition to next step
* Trigger recovery if mismatch

Forbidden:

* DOM operations
* UI rendering
* selector logic
* business logic

---

## 6. Behavior Layer

Behavior layer is ONLY responsible for:

* Listening DOM events
* Normalizing events
* Emitting events to EventBus

It MUST NOT:

* change state
* decide next step
* trigger navigation

---

## 7. Adapter Layer

Adapter is READ + RENDER ONLY.

Allowed:

* query DOM
* highlight elements
* render overlay UI

Forbidden:

* click()
* fill()
* submit()
* triggering actions

---

## 8. Recovery System

Recovery handles mismatch between expected step and real UI state.

Modules:

* validator.ts → check correctness
* recovery.ts → fix or reset
* reconcile.ts → find nearest valid step

---

## 9. MVP Scope (v1 ONLY)

Supported:

* linear workflows
* click steps
* form steps
* route steps
* basic recovery

NOT supported:

* DAG workflows
* AI agents
* auto execution
* dynamic step generation

---

## 10. Execution Flow

1. User interacts with UI
2. Behavior listener captures event
3. EventBus forwards event
4. Runtime engine decides transition
5. Recovery runs if needed
6. Adapter updates UI overlay
7. Next step activated

---

## 11. Success Criteria

* Flow executes step-by-step deterministically
* User performs all actions manually
* No automatic DOM manipulation exists
* Recovery handles mismatches gracefully
* System remains predictable and debuggable
