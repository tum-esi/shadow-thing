# Math
Math is generally used where a `numeric` or `boolean` value is needed. Can, however, also return e.g. formatted strings.

## Schema
One of:
- Type: [ParameterizedString] - a [mathjs expression][mathjsexpr]

- Type: `object`
    | Property | Description | Mandatory | Type | Default |
    |----------|-------------|:---------:|------|:-------:|
    |expr|A [mathjs expression][mathjsexpr].|yes|[ParameterizedString]||
    |scope|See [mathjs evaluate()][eval]. Should return an `object`.||[ValueSource]||
    |conf|A [mathjs configuration][mathjsconf].||`object`||
    |comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

    **\*** additional properties are not allowed.

## Behavior
Is based on the [evaluate()][eval] of [mathjs] where the expression is a `string`.

## Examples
Some example values:
- Constant value: `"100"`, `"true"`, etc.
- Plain arithmetic: `"5 + 4"`
- Arithmetic with dymanic paremeters ([Pointer]): `"${path/to/some/value} + 123"`
- Logic with dymanic paremeters:  
    ```JSON
    [
        "( ${path/to/some/number1} >= 0 and ${path/to/some/bool} )",
        "or ${path/to/some/number2} == 100"
    ]
    ```
- With configuration:
    ```JSON
    {
        "expr": "random()",
        "conf": {
            "randomSeed": 123
        }
    }
    ```
- With scope:
    ```JSON
    {
        "expr": "a + b",
        "scope": {
            "compound": {
                "a": 5,
                "b": 10
            }
        }
    }
    ```
    ```JSON
    {
        "expr": "a + b",
        "scope": {
            "pointer": "path/to/scope/object"
        }
    }
    ```
- Compare stringified objects:
    `"compareText("${path/to/obj1}, ${path/to/obj2})"`

- ...and many more possibilities (see [mathjs function reference][mathjsfunc] and [mathjs expression syntax][mathjsexprsyntax])
    





[Pointer]: Pointer.md
[ValueSource]: ValueSource.md
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine
[ParameterizedString]: ParameterizedString.md
[mathjs]: https://mathjs.org/
[eval]: https://mathjs.org/docs/reference/functions/evaluate.html
[mathjsfunc]: https://mathjs.org/docs/reference/functions.html
[mathjsexpr]: https://mathjs.org/docs/expressions/
[mathjsexprsyntax]: https://mathjs.org/docs/expressions/syntax.html
[mathjsconf]: https://mathjs.org/docs/core/configuration.html
[vtd]: ../Definitions.md#Virtual-Thing-Description