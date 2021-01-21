# ValueSource
Is used to `read` or `create` a value and return where needed.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|math|See [Math].||[Math]||
|compound|See [CompoundData].||[CompoundData]||
|pointer|Return a value from any [DataHolder] instance.||[Pointer]||
|file|Return raw or json-parsed file content.||[File]||
|operation|See [Read operations](#read-operations).||[ReadOperation]|`"get"`|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
- A `ValueSource` instance can be of only one of the following types:
`math`, `compound`, `pointer` or `file` depending on which property is specified.  

- Behavior of each `operation` depends on the type of the `ValueSource` and is described in [Read operations](#read-operations).

### Read operations
- For a `pointer` ([Pointer]):
    - `"get"` - Returns a value by reference.
    - `"pop"` - Pops an item. Valid only when accessing an array, and popping an item will not lead to a failure of validation of the [DataHolder] against its schema.
    - `"copy"` - Returns a deep copy of the value.
    - `"length"` - Length of an array or string. Not applicable to other data types.
    - `"parse"` - Parse a value from a JSON string. Applicable to valid JSON serialization strings only.

- For a `file` ([File]):
    - `"get"`, `"pop"` and `"copy"` - Return the utf-8 encoded content of the file.
    - `"length"` - Returns the length of the utf-8 encoded content of the file.
    - `"parse"` - Parses the utf-8 encoded content of the file as a JSON value and returns. The content of the file must be a valid JSON serialization.


- Read operations are ignoder by `math` ([Math]) and `compound` ([CompoundData]).





[ReadOperation]: Enums.md#ReadOperation

[Math]: Math.md
[CompoundData]: CompoundData.md
[Pointer]: Pointer.md
[File]: File.md

[DataHolder]: ../main_components/DataHolder.md

[Engine]: ../Definitions.md#Virtual-Thing-Engine-and-Engine
