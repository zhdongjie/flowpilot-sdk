# FlowPilot v1 - Final Implementation Plan

## 1. Project Definition

FlowPilot v1 is a deterministic, event-driven UI Step State Machine SDK.

It guides users through web workflows by:
- Highlighting UI elements
- Listening to user actions
- Advancing steps deterministically
- Recovering from UI mismatches

It is NOT:
- An AI agent system
- A browser automation tool
- A RPA execution engine

---

## 2. Core Architecture

### System Flow (MANDATORY)

```

User Action
↓
Behavior Layer (event normalization ONLY)
↓
EventBus
↓
Runtime Engine (SINGLE source of truth)
↓
Validator (uses Adapter)
↓
Recovery Engine (if mismatch)
↓
Reconcile Engine (state repair)
↓
Adapter (UI render ONLY)

````

---

## 3. Folder Structure (STRICT)

src/
  core/
    step.ts
    workflow.ts
    types.ts

  runtime/
    engine.ts        # ONLY decision maker
    state.ts
    eventBus.ts
    lifecycle.ts

  behavior/
    listener.ts      # event normalization ONLY

  adapter/
    dom.ts           # DOM truth + UI render ONLY

  recovery/
    validator.ts
    recovery.ts
    reconcile.ts

---

## 4. Step Model (PURE CONFIG ONLY)

Step MUST be immutable configuration.

```ts
type Step = {
  id: string;
  type: "click" | "form" | "route";
  highlight: string;
  desc?: string;
};
````

### FORBIDDEN in Step:

* state
* status
* behavior
* runtime logic
* auto execution

---

## 5. Runtime Engine (CORE RULE)

runtime/engine.ts is the ONLY decision center.

Responsibilities:

* Handle events
* Validate step progress
* Trigger recovery
* Advance steps

FORBIDDEN:

* DOM access
* UI rendering
* selector logic
* business logic

---

## 6. Behavior Layer

Behavior layer is ONLY an event translator.

Responsibilities:

* Listen DOM events
* Normalize events
* Emit to EventBus

FORBIDDEN:

* Step transition logic
* Validation
* State mutation
* DOM decision logic

---

## 7. Adapter Layer (CRITICAL)

Adapter is the ONLY source of DOM truth.

Responsibilities:

* Query DOM elements
* Resolve step → element mapping
* Render highlight / tooltip
* Provide match utilities

FORBIDDEN:

* click()
* fill()
* submit()
* triggering user actions
* flow control logic

---

## 8. Recovery System

Recovery handles mismatch between expected and actual UI state.

Modules:

* validator.ts → checks correctness using Adapter
* recovery.ts → decides recovery strategy
* reconcile.ts → repairs runtime state

Rules:

* NO DOM querying logic inside recovery
* NO UI rendering inside recovery
* ONLY decision + state correction

---

## 9. Execution Flow

1. User interacts with UI
2. Behavior captures event
3. EventBus forwards event
4. Runtime engine processes event
5. Validator checks using Adapter
6. If mismatch → Recovery triggers
7. Reconcile fixes state
8. Adapter updates UI overlay
9. Runtime advances step

---

## 10. MVP Scope (STRICT)

Supported:

* Linear workflows
* click steps
* form steps
* route steps
* basic recovery (retry / reset / remap)

NOT supported:

* DAG workflows
* AI agent reasoning
* autonomous execution
* dynamic workflow generation
* parallel steps

---

## 11. Success Criteria

* Fully deterministic step execution
* No automatic DOM manipulation
* All transitions controlled by runtime
* Recovery handles UI mismatch gracefully
* System remains debuggable and predictable

---

## 12. Engineering Principle

"UI is observed, not controlled."

FlowPilot observes user behavior and guides, but never executes actions on behalf of the user.
