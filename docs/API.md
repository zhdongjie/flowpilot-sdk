# API

## FlowPilot.version

SDK version string.

## FlowPilot.init(config)

### Parameters

- workflow
- mapping
- debug
- autoStart
- getCurrentPage
- getState
- onStepChange
- onFinish
- onError

## FlowPilot.start(taskId)

Start a workflow by id.

Behavior events are detected automatically by the SDK bridge layer (`click`, `form submit`, `route`, `network success`).

## FlowPilot.reset()

Reset current flow state.

## FlowPilot.destroy()

Destroy runtime and remove Shadow DOM.

