# Delay
Delay is used in an [Instruction] to delay execution of the latter. Delay can be hard-coded as well as dynamic.

## Schema
Type: [Math] - delay in milliseconds.

## Examples
> NOTE: The examples are complete ready-to-run [Virtual Thing Descriptions][vtd].

In the following example, the [Loop] instruction is delayed until the `beginning of the next minute` using a "dynamic" `delay`. The Loop then logs local time once a minute:
```JSON
{
    "title": "MinuteTickerThing",
    "processes": {
        "minuteTicker":{
            "triggers": [{"runtimeEvent": "startup"}],
            "instructions": [
                {
                    "delay": "60000 - (${dt/unix} % 60000)",
                    "loop": {
                        "interval": "60000",
                        "instructions": [
                            {"log": "${dt/local}"}
                        ]
                    }
                }
            ]
        }
    }
}
```


[Math]: Math.md
[Instruction]: ../instructions/Instruction.md
[Loop]: ../instructions/Loop.md
[vtd]: ../Definitions.md#Virtual-Thing-Description