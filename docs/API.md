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

## FlowPilot.next()

Advance to the next step.

## FlowPilot.reset()

Reset current flow state.

## FlowPilot.destroy()

Destroy runtime and remove Shadow DOM.
