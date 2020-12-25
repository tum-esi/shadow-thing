# Virtual Thing Description Specification

# Contents:

- [Introduction]
- [Definitions]
- [Architecture]
- Components
    - Main Components
        - [VirtualThingModel]
        - [DataHolder]
        - [Process]
        - [Property]
        - [Action]
        - [Event]
        - [Sensor]
        - [Actuator]
    - Instructions
        - [Instruction]
        - [Fake]
        - [Control]
        - [Move]
        - [IfElse]
        - [Switch]
        - [TryCatch]
        - [Loop]
        - [ReadProperty]
        - [WriteProperty]
        - [ObserveProperty]
        - [UnobserveProperty]
        - [InvokeAction]
        - [EmitEvent]
        - [SubscribeEvent]
        - [UnsubscribeEvent]
        - [InvokeProcess]
        - [Log]
        - [Info]
        - [Warn]
        - [Debug]
        - [Error]
    - Helper Components
        - [CompoundData]
        - [DateTime]
        - [Delay]
        - [File]
        - [Interval]
        - [Math]
        - [Pointer]
        - [ParameterizedString]
        - [Trigger]
        - [ValueSource]
        - [ValueTarget]
- [Logs and errors][LogsAndErrors]
- [Further Work][FurtherWork]



[Introduction]: Introduction.md
[Definitions]: Definitions.md
[Architecture]: Architecture.md
[VirtualThingModel]: main_components/VirtualThingModel.md
[DataHolder]: main_components/DataHolder.md
[Process]: main_components/Process.md
[Property]: main_components/Property.md
[Action]: main_components/Action.md
[Event]: main_components/Event.md
[Sensor]: main_components/Sensor.md
[Actuator]: main_components/Actuator.md
[Instruction]: instructions/Instruction.md
[Fake]: instructions/Fake.md
[Control]: instructions/Control.md
[Move]: instructions/Move.md
[IfElse]: instructions/IfElse.md
[Switch]: instructions/Switch.md
[TryCatch]: instructions/TryCatch.md
[Loop]: instructions/Loop.md
[ReadProperty]: instructions/ReadProperty.md
[WriteProperty]: instructions/WriteProperty.md
[ObserveProperty]: instructions/ObserveProperty.md
[UnobserveProperty]: instructions/UnobserveProperty.md
[InvokeAction]: instructions/InvokeAction.md
[EmitEvent]: instructions/EmitEvent.md
[SubscribeEvent]: instructions/SubscribeEvent.md
[UnsubscribeEvent]: instructions/UnsubscribeEvent.md
[InvokeProcess]: instructions/InvokeProcess.md
[Log]: instructions/Console.md#Log
[Info]: instructions/Console.md#Info
[Warn]: instructions/Console.md#Warn
[Debug]: instructions/Console.md#Debug
[Error]: instructions/Console.md#Error
[CompoundData]: helper_components/CompoundData.md
[DateTime]: helper_components/DateTime.md
[Delay]: helper_components/Delay.md
[File]: helper_components/File.md
[Interval]: helper_components/Interval.md
[Math]: helper_components/Math.md
[Pointer]: helper_components/Pointer.md
[ParameterizedString]: helper_components/ParameterizedString.md
[Trigger]: helper_components/Trigger.md
[ValueSource]: helper_components/ValueSource.md
[ValueTarget]: helper_components/ValueTarget.md
[LogsAndErrors]: LogsAndErrors.md
[FurtherWork]: FurtherWork.md