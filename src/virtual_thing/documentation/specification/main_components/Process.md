# Process
A component that can be `executed` by the [Engine] as a sequence of instructions to perform the described behavior.

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|triggers|Triggers define when the process should be invoked.||Array of [Trigger]||
|condition|If specified, the `Process` can be executed only if the condition is met, i.e. the value of the expression can be interpreted as `true`.||[Math]||
|stateMachine|The state machine that is executed when the the process is invoked.|yes, if no `instructions` are defined|[StateMachine](#StateMachine)||
|instructions|The instructions that are executed when the process is invoked.|yes, if no `stateMachine` is defined|Array of [Instruction], at least 1 item||
|dataMap|See [DataMap].||Map of [DataHolder]||
|wait|Whether the `Process` should "await" the execution of the `stateMachine` and/or the `instructions`.||`boolean`|true|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior

### Invocation
A `Process` can be invoked using the following methods:
1. `triggers`
2. [Instruction] of type [invokeProcess]
3. See `Implicitly attached processes` of [Property], [Action] or [Event]

The method `2.` can be used at the same time with either of the methods `1.` and `3.`. The methods `1.` and `3.` are mutually exclusive.

When a `Process` is invoked, first, the `stateMachine` (if specified) is executed and, then the `instructions` (if specified) are executed. The `instructions` are invoked only after the `stateMachine` has completed its transition, i.e. the `stateMachine` is awaited by the `instructions`.

> Hint: Instructions can be used e.g. to do some post-processing after any state transition.


# StateMachine

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|delay|A base delay for any transition. Further, [State](#State)-specific and [Transition](#Transition)-specific delays can be added to this delay to define the actual delay of a specific transition.||[Delay]||
|input|The input buffer of the state machine.||[DataHolder]||
|output|The output buffer of the state machine.||[DataHolder]||
|states|Description of states and their transitions (graph).|yes|Map of [State](#State)||
|initialState|The name of the initial state.|yes|string||
|reset|Default transitions for the `"reset"` behavior. Can be overriden by [State](#State)-specific transitions for the `"reset"` behavior.||Array of [Transition](#Transition)||
|error|Default transitions for the `"error"` behavior. Can be overriden by [State](#State)-specific transitions for the `"error"` behavior||Array of [Transition](#Transition)||
|before|Instructions to execute before State Machine execution.||Array of [Instruction]||
|after|Instructions to execute after State Machine execution.||Array of [Instruction]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.


## StateMachine Behavior

### Initial state
The [State](#State) defined by the `initialState` property of the StateMachine is `entered` (**!!!** see [State Behavior](#State-Behavior)).

### Execution
Every time a Process is invoked:
1. If there is a `before` defined for the StateMachine, then it is executed. 
2. The StateMachine is updated, e.g. a state transition happens and/or the output changes...or not depending on the current situation (e.g. current state, input, etc.) and how it is handled by the design of the StateMachine.
3. If there is an `after` defined for the StateMachine, then it is executed. 

### Normal state transition
Normal state transitions happen in **all cases** of Process [invocation](#Invocation) **except** when the Process is invoked using the [invokeProcess] instruction **with** either `"reset"` or `"error"` [StateMachineOperation] (see [invokeProcess]).

On normal state transition, the array of [Transitions](#Transition) defined by the `"trans"` property (if defined) of the **current** [State](#State) is processed as described in [Transition Behavior](#Transition-Behavior).

### Reset handling
Reset handling happens **only** if the Process is invoked using the [invokeProcess] instruction **with** the `"reset"` [StateMachineOperation] (see [invokeProcess]).

1. On Reset, the array of [Transitions](#Transition) defined by the `"reset"` property (if defined) of the **current** [State](#State) is processed as described in [Transition Behavior](#Transition-Behavior).
2. **If** no `matching` occurs in the previous step, **then** the array of [Transitions](#Transition) defined by the `"reset"` property of the **StateMachine self** is processed in the same way.

### Error handling
Error handling happens **only** if the Process is invoked using the [invokeProcess] instruction **with** the `"error"` [StateMachineOperation] (see [invokeProcess]).

1. On Error, the array of [Transitions](#Transition) defined by the `"error"` property (if defined) of the **current** [State](#State) is processed as described in [Transition Behavior](#Transition-Behavior).
2. **If** no `matching` occurs in the previous step, **then** the array of [Transitions](#Transition) defined by the `"error"` property of the **StateMachine self** is processed in the same way.

### Input, output, and state
For each StateMachine, the [Engine] creates a `sm-state-buffer` buffer to store the name of the actual [State](#State), and for each of the specified properties `input` and `output`, it creates respectively `sm-input-buffer` and `sm-output-buffer` buffers to store respectively the input and the output values of the StateMachine.

The `sm-input-buffer`, `sm-output-buffer`, and `sm-state-buffer` can be accessed using [Pointer] (see [Process specific tockens][proc_tockens]). That means, the `input` can be written using a [Move] instruction, and the `output` and the `state` can be accessed as any other [DataHolder] instance.

> Hint: Changing the input of a StateMachine does not initiate state transition automatically. To initiate a state change based on a new input, the Process should be invoked explicitly.



# State

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|delay|A current state-specific transition delay. is added to the [StateMachine](#StateMachine)-specific and the [Transition](#Transition)-specific delays to define the actual delay of a specific transition from this State.||[Delay]||
|output|The Moore output value. Is overwritten by any `incoming` [Transition](#Transition)-specific (Mealy) output value.||[ValueSource]||
|trans|Normal state transitions.||Array of [Transition](#Transition)||
|reset|`"Reset"`-behavior-specific state transitions.||Array of [Transition](#Transition)||
|error|`"Error"`-behavior-specific state transitions.||Array of [Transition](#Transition)||
|enter|Instructions to execute after the State is entered.||Array of [Instruction]||
|exit|Instructions to execute before the State is exited.||Array of [Instruction]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## State Behavior
### Exiting a State
When a State is exited by a [Transition](#Transition):
- If there is an `exit` defined for the State, then it is executed.

### Entering a State
When a State is entered (either by [Transition](#Transition) or as initial state defined by the `initialState` property of the [StateMachine](#StateMachine)):
1. The name of the State is written to the `sm-state-buffer` of the [StateMachine](#StateMachine).
2. If there is an `output` defined for the State, then the `output` value is written to the `output` of the [StateMachine](#StateMachine).
3. If there is an `enter` defined for the State, then it is executed.

# Transition

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|delay|A transition-specific delay. is added to the [StateMachine](#StateMachine)-specific and the [State](#Transition)-specific delays to define the actual delay of the Transition.||[Delay]||
|next|The name of the next state.|yes|string||
|input|If specified, then matching of the `input` value of the Transition and the `input` value of the [StateMachine](#StateMachine) is a necessary condition for the Transition to happen (see [Transition Behavior](#Transition-Behavior)).||[ValueSource]||
|condition|If specified, then satisfaction of the `condition` is a necessary condition for the Transition to happen (see [Transition Behavior](#Transition-Behavior)). ||[Math]||
|output|The output value of the [StateMachine](#StateMachine) that results from this Transition (The Mealy output). Will overwrite the `output` of the [State](#State) defined by `next`. ||[ValueSource]||
|before|Instructions to execute before the Transition starts.||Array of [Instruction]||
|after|Instructions to execute after the Transition finishes.||Array of [Instruction]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.


## Transition Behavior
- The first Transition in an array of Transitions, whose `input` value is either **missing** or **matches** the current `input` value of the [StateMachine](#StateMachine), and whose `condition` is either **missing** or is **met**, is selected as the `matching Transition` and executed.
- During execution of a Transition:
    1. If there is a `delay` defined for the Transition, then it is executed.
    2. If there is a `before` defined for the Transition, then it is executed.
    3. The current [State](#State) of the [StateMachine](#StateMachine) is [exited](#Exiting-a-State).
    4. The [State](#State) defined by the `next` property of the Transition is [entered](#Entering-a-State).
    5. If there is an `output` defined for the Transition, then the `output` value is written to the `output` of the [StateMachine](#StateMachine). This output **overwrites** the output that was generated (if any) while [entering](#Entering-a-State) the next state.
    6. If there is an `after` defined for the Transition, then it is executed.
- During the `matching` process, comparison of the Transition's `input` value and the [StateMachine's](#StateMachine) `input` value is achieved by comparing their serializations (string comparison).
- If no `matching Transition` is selected, then no Transition happens (the `state` and the `output` of the [StateMachine](#StateMachine) remain unchanged, no respective Instructions are executed).

> Hint: Transitions are matched in the order of their appearance in an array of Transitions, and only the first `matching Transition` is executed. When designing Transitions, please pay attantion on where you place which `inputs` and `conditions`. For example, if a Transition does not have any `input` or `condition` defined, it is matched by default. Such a Transition hence should be the **last item** in a Transitions array. It then can be used, e.g. as a default Transition in case no other Transition in the array is `matched`.

> Hint: The `input` field can be used when one of the criteria to execute a Transition is the input value of the [StateMachine](#StateMachine). The `condition` is a more flexible and powerful mechanism as it is based on [Math]. It can actually replace the `input`-based matching mechanism as it allows to compare values, e.g.: the current input value of the [StateMachine](#StateMachine) obtained via a [Pointer] can be compared with a constant value or a dynamic value obtained via a [Pointer].

## State Machine Examples

- A Process with a basic traffic light state machine. To initiate state changes, the Process needs to be invoked. Driving the state machine to the error state or resetting it requires invoking the Process with a respective state machine operation ([invokeProcess]).
    ```JSON
    {
        "stateMachine": {
            "reset": [{"next": "red"}],
            "error": [{"next": "error"}],
            "states": {
                "error": {},
                "red": {"trans": [{"next": "green"}]},
                "yellow": {"trans": [{"next": "red"}]},
                "green": {"trans": [{"next": "yellow"}]}
            },
            "initialState": "red"
        }
    }
    ```
- A 2-bit up/down counter Moore machine. This example demonstrates how the input can define the next state transitions. The output in this example is a Moore output.
    ```JSON
    {
        "stateMachine": {
            "input": {"default": "up"},
            "output": {"default": 0},
            "reset": [{"next": "s0"}],
            "error": [{"next": "err"}],
            "states": {
                "err": {"output": {"compound": "ERROR"}},
                "s0": {
                    "output": {"compound": 0},
                    "trans": [
                        {"input": {"compound": "up"}, "next": "s1"},
                        {"input": {"compound": "down"}, "next": "s3"}
                    ]
                },
                "s1": {
                    "output": {"compound": 1},
                    "trans": [
                        {"input": {"compound": "up"}, "next": "s2"},
                        {"input": {"compound": "down"}, "next": "s0"}
                    ]
                },
                "s2": {
                    "output": {"compound": 2},
                    "trans": [
                        {"input": {"compound": "up"}, "next": "s3"},
                        {"input": {"compound": "down"}, "next": "s1"}
                    ]
                },
                "s3": {
                    "output": {"compound": 3},
                    "trans": [
                        {"input": {"compound": "up"}, "next": "s0"},
                        {"input": {"compound": "down"}, "next": "s2"}
                    ]
                }
            },
            "initialState": "s0"
        }
    }
    ```
- The following example is a ready and runnable [Virtual Thing Descriptions][vtd].
It contains a [Process](#Process) "trafficLight" that describes a simple traffic ligth [StateMachine](#StateMachine) that can be manipulated using [Actions][Action]. Each Action initiates respective transitions in the state machine and returns the new current state. The current state can also be read using the "state" [Property].
The state machine looks big as it contains all possible additional custom "before", "after", "enter", and "exit" handlers. The handlers simply log messages in the console indicating which handler is invoked. If the handlers are removed, the state machine is identical to that from the first example.
    ```JSON
    {
        "title": "TrafficLightStateMachine",
        "properties": {
            "state": {}
        },
        "actions": {
            "reset": {"output":{}},
            "error": {"output":{}},
            "transit": {"output":{}}
        },

        "processes": {

            "resetHandler": {
                "triggers": [{"runtimeEvent": "invokeAction", "interactionAffordance": "reset"}],
                "instructions": [
                    {"invokeProcess": {"pointer": "proc/trafficLight", "smOperation": "reset"}},
                    {"move": {"from": {"compound": "New state: ${proc/trafficLight/sm/state}"}, "to": {"pointer": "a/reset/o"}}}
                ]
            },

            "errorHandler": {
                "triggers": [{"runtimeEvent": "invokeAction", "interactionAffordance": "error"}],
                "instructions": [
                    {"invokeProcess": {"pointer": "proc/trafficLight", "smOperation": "error"}},
                    {"move": {"from": {"compound": "New state: ${proc/trafficLight/sm/state}"}, "to": {"pointer": "a/error/o"}}}
                ]
            },

            "transitHandler": {
                "triggers": [{"runtimeEvent": "invokeAction", "interactionAffordance": "transit"}],
                "instructions": [
                    {"invokeProcess": "proc/trafficLight"},
                    {"move": {"from": {"compound": "New state: ${proc/trafficLight/sm/state}"}, "to": {"pointer": "a/transit/o"}}}
                ]
            },

            "readHandler": {
                "triggers": [{"runtimeEvent": "readProperty", "interactionAffordance": "state"}],
                "instructions": [
                    {"move": {"from": {"pointer": "proc/trafficLight/sm/state"}, "to": {"pointer": "p/state/o"}}}
                ]
            },

            "trafficLight": {
                "stateMachine": {
                    "before": [
                        {"log": "trafficLight: Process call at: ${dt/iso}"},
                        {"log": "trafficLight: Before State Machine update."}
                    ],
                    "after": [{"log": "trafficLight: After State Machine update."}],
                    "reset": [
                        {
                            "next": "red",
                            "before": [{"log": "trafficLight: Before SM Reset"}],
                            "after": [{"log": "trafficLight: After SM Reset"}]
                        }
                    ],
                    "error": [
                        {
                            "next": "error",
                            "before": [{"log": "trafficLight: Before SM Error"}],
                            "after": [{"log": "trafficLight: After SM Error"}]
                        }
                    ],
                    "states": {
                        "error": {
                            "exit": [{"log": "trafficLight: Exit Error"}],
                            "enter": [{"log": "trafficLight: Enter Error"}]
                        },
                        "red": {
                            "exit": [{"log": "trafficLight: Exit Red"}],
                            "enter": [{"log": "trafficLight: Enter Red"}],
                            "trans": [
                                {
                                    "next": "green",
                                    "before": [{"log": "trafficLight: Before Transition Red ----> Green"}],
                                    "after": [{"log": "trafficLight: After Transition Red ----> Green"}]
                                }
                            ]
                        },
                        "yellow": {
                            "exit": [{"log": "trafficLight: Exit Yellow"}],
                            "enter": [{"log": "trafficLight: Enter Yellow"}],
                            "trans": [
                                {
                                    "next": "red",
                                    "before": [{"log": "trafficLight: Before Transition Yellow ----> Red"}],
                                    "after": [{"log": "trafficLight: After Transition Yellow ----> Red"}]
                                }
                            ]
                        },
                        "green": {
                            "exit": [{"log": "trafficLight: Exit Green"}],
                            "enter": [{"log": "trafficLight: Enter Green"}],
                            "trans": [
                                {
                                    "next": "yellow",
                                    "before": [{"log": "trafficLight: Before Transition Green ----> Yellow"}],
                                    "after": [{"log": "trafficLight: After Transition Green ----> Yellow"}]
                                }
                            ]
                        }
                    },
                    "initialState": "red"
                }
            }
        }
    }
    ```




[Instruction]: ../instructions/Instruction.md
[Move]: ../instructions/Move.md
[Log]: ../instructions/Log.md
[InvokeProcess]: ../instructions/InvokeProcess.md

[Math]: ../helper_components/Math.md
[Pointer]: ../helper_components/Pointer.md
[proc_tockens]: ../helper_components/Pointer.md#Process-specific-tockens
[Delay]: ../helper_components/Delay.md
[Trigger]: ../helper_components/Trigger.md
[ValueSource]: ../helper_components/ValueSource.md
[StateMachineOperation]: ../helper_components/Enums.md#StateMachineOperation

[Property]: Property.md
[Action]: Action.md
[Event]: Event.md
[DataHolder]: DataHolder.md

[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[DataMap]: ../Architecture.md#DataMap

[vtd]: ../Definitions.md#Virtual-Thing-Description