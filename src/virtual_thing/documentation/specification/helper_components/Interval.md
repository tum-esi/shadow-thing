# Interval
Interval is used in [Trigger] and [Loop] instances to achieve periodic behavior.

## Schema
Type: [Math] - interval in milliseconds.

## Behavior
An `Interval` performs in a best-effort manner, i.e. it defines the `lower bound` of the time interval between two consecutive events, such as [Trigger] invocations or [Loop] iteratios. The `actual interval` depends on the processing time of the events:
- If the time between invokation of a [Trigger] (respectively, invokation of the [Process] to which the [Trigger] is attached) and completion of its processing, i.e. the `processing time`, takes longer than the duration of the respective `Interval`, then the `actual interval` will be adjusted to fit the `processing time`.
- If the `processing time` of a [Loop's][Loop] iteration takes longer than the duration of the respective `Interval`, then the `actual interval` will be adjusted to fit the `processing time`.

As such, an `Interval` will not cause *overlapping or parellel events* in case `processing time` of a single event takes longer than the specified interval.

> NOTE: The above mentioned `processing times` depends on:
> - processing time of respective [Instructions][Instruction]
> - value of the `wait` property in respective [Trigger], [Process] and [Instruction] instances.

## Examples
> NOTE: The examples are complete ready-to-run [Virtual Thing Descriptions][vtd].

- In the following example, the [Loop] instruction logs [unix timestamp](https://www.unixtimestamp.com/) once a second.

    ```JSON
    {
        "title": "Ticker",
        "processes": {
            "minuteTicker":{
                "triggers": [{"runtimeEvent": "startup"}],
                "instructions": [
                    {
                        "loop": {
                            "interval": "1000",
                            "instructions": [
                                {"log": "${dt/unix}"}
                            ]
                        }
                    }
                ]
            }
        }
    }
    ```

- In the following example, the [Process] "proc" is invoked by a [Trigger] with an `Interval` value taken from the variable ([DataHolder]) "dur". The process logs [unix timestamp](https://www.unixtimestamp.com/).
    ```JSON
    {
        "title": "MinuteTickerThing",
        "processes": {
            "proc":{
                "dataMap": {
                    "dur": { "const": 1000 }
                },
                "triggers": [{"interval": "${./dmap/dur}"}],
                "instructions": [
                    {"log": "${dt/unix}"}
                ]
            }
        }
    }
    ```


[Math]: Math.md
[Instruction]: ../instructions/Instruction.md
[Loop]: ../instructions/Loop.md
[Trigger]: Trigger.md
[Process]: ../main_components/Process.md
[DataHolder]: ../main_components/DataHolder.md
[vtd]: ../Definitions.md#Virtual-Thing-Description