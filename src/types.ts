type DTCustomResponse = {
    data: any,
    accuracy: number
}

type DTCustomHandler = (lastValue: any, timestamp: Date) => Promise<DTCustomResponse>

type VTconfig = {
    eventIntervals: {
        [key: string]: number
    }
}