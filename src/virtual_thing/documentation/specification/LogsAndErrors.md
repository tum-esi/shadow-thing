# Logs and Errors
Console messages produced by the [Engine].

## Message format
```
VT_<log_level_with_capital_letters>: <path_to_the_message_source>: <message>
```
Example:
```
VT_INFO: /TestThing/events/testEvent: Event.emit()
```

## Logs
The [Engine] logs messages:
- when it creates components of a [VirtualThingModel]:
    ```
    VT_INFO: /TestThing: VirtualThingModel
    VT_INFO: /TestThing/properties: ComponentMap
    VT_INFO: /TestThing/properties/testProp: Property
    VT_INFO: /TestThing/properties/testProp/data: Data
    ...
    ```
- function calls when interaction events happen in runtime, e.g.:
    ```
    VT_INFO: /TestThing/events/testEvent: Event.emit()
    ```
- lifecycle of a [VirtualThingModel], e.g.:
    ```
    VT_INFO: /TestThing: VirtualThingModel.start()
    ```
    ```
    VT_INFO: /TestThing: VirtualThingModel.failure()
    ```
    ```
    VT_INFO: /TestThing: VirtualThingModel.stop()
    ```


## Errors
Errors that occur in the context of interaction with affordances by an external consumer (e.g. consumer passed an invalid payload) do not cause [VirtualThingModel failure][failure], they are just printed in the console.

## Fatal Errors
Fatal errors will issue a [VirtualThingModel failure][failure], unless the error occurred within the `try` block of a [TryCatch] instruction. A model failure will [stop] the [VirtualThingModel] instance that has failed in order to prevent unpredictable behavior. The other [VirtualThingModel] instances will not be affected and the program should not crash.

Possible fatal error sources:
- possible bugs 
- a poor [Virtual Thing Description][vtd] design, e.g.:
    - data validation failure
    - an incompatible operation on data
    - invalid pointer
    - invalid [Math] expression
    - etc.
- errors that may happen while executing [Instructions][Instruction] that interact with a ConsumedThing, e.g.: a property affordance returns a different data type from what was assumed by the [Virtual Thing Description][vtd].

To avoid failures, you can use the [TryCatch] instruction.

## Error stack trace
When an error occurs, the printed message will contain a stack of the objects that can help to trace the root of the problem.  
The following is an example of validation failure on a write operation to a [DataHolder].
```
VT_ERROR: TestThing:
Model failed:
/TestThing/processes/process1/triggers/0:
/TestThing/processes/process1:
/TestThing/processes/process1/instructions:
/TestThing/processes/process1/instructions/0/invokeProcess:
/TestThing/processes/process2:
/TestThing/processes/process2/instructions:
/TestThing/processes/process2/instructions/0/move:
/TestThing/processes/process2/instructions/0/move/to:
/TestThing/processes/process2/instructions/0/move/to/pointer:
Couldn't write value:
/TestThing/dataMap/value:
Validation failed: 
Operation: set
Value: 123
Path: root
Reason: data should be string:
Pointer info:
original path: dmap/value
resolved path: dmap/value
expected types: WritableData 
actual component type: Data
```



[vtd]: Definitions.md#virtual-thing-description
[Engine]: Definitions.md#Virtual-Thing-Engine-and-Engine
[failure]: main_components/VirtualThingModel.md#failure
[stop]: main_components/VirtualThingModel.md#stop
[start]: main_components/VirtualThingModel.md#start
[VirtualThingModel]: main_components/VirtualThingModel.md
[DataHolder]: main_components/DataHolder.md
[TryCatch]: instructions/TryCatch.md
[Instruction]: instructions/Instruction.md
[Math]: helper_components/Math.md