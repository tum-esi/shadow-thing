# Switch
Is a type of [Instruction] that is an analog of the `switch-case` block in programming languages.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|switch|A pointer to the value that is "switched".|yes|[Pointer]||
|cases|The "case" blocks sequence.|yes|Array of [Case](#Case), at least 1 item||
|default|The "default" block.||Array of [Instruction], at least 1 item||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
Behavior is similar to that of a typical "switch-case" statement.

# Case

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|case|The value of the "case".|yes|[ValueSource]||
|instructions|Instructions to execute if the `case` is [matched](#case-matching).||Array of [Instruction], at least 1 item||
|break|The "brake" command.||`boolean`|true|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

## Behavior
If the `case` is [matched](#case-matching):
1. If the `instructions` are specified, they will be executed.
2. If the `break` is `true`, the parent [Switch](#switch) will exit.

### Case Matching
Matching is performed by comparison of the **`stringified`** values of the *value returned by the `case`* and the *value returned by the `switch` of the parent [Switch](#switch)*.

[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md

[Pointer]: ../helper_components/Pointer.md
[ValueSource]: ../helper_components/ValueSource.md