import Debug from 'debug'
import { ema, sma, macd } from 'technicalindicators'

const debug = Debug('interfaces:indicatorer')

export type Indicatorer = {
  ema: (source: number[], length: number) => number[]
  macd: (source: number[], fastLength?: number, slowLength?: number, signalLength?: number) => MacdOutput[]
  sma: (source: number[], length: number) => number[]
  stc: (
    source: number[],
    length?: number,
    fastLength?: number,
    slowLength?: number,
    factor?: number
  ) => number[]
}

type MacdOutput = {
  macd?: number
  signal?: number
  histogram?: number
}

export const Indicatorer: Indicatorer = {
  ema: (source, length) => {
    let emaSeries: number[] = []
    const k = 2 / (length + 1)
    source.forEach((val, i) => emaSeries.push(val * k + (i === 0 ? 0 : emaSeries[i - 1] * (1 - k))))
    return emaSeries
  },
  macd: (source, fastLength = 12, slowLength = 26, signalLength = 9) =>
    macd({
      values: source,
      fastPeriod: fastLength,
      slowPeriod: slowLength,
      signalPeriod: signalLength,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    }).map(({ MACD: macd, ...rest }) => ({ macd, ...rest })),
  sma: (source, length) => sma({ period: length, values: source }),
  stc: (source, length = 10, fastLength = 23, slowLength = 50, factor = 0.5) => {
    const emaFastSeries = Indicatorer.ema(source, fastLength)
    const emaSlowSeries = Indicatorer.ema(source, slowLength)

    const macd = emaFastSeries.map((emaFast, i) => emaFast - emaSlowSeries[i])

    let stoKSeries: number[] = [],
      smoothedStoKSeries: number[] = [],
      stoDSeries: number[] = [],
      smoothedStoDSeries: number[] = []

    macd.forEach((m, i) => {
      // lookback
      const xmacd = macd.slice(i + 1 - length - 1, i + 1)

      const low1 = Math.min(...xmacd) // v1
      const high1 = Math.max(...xmacd) // v2

      stoKSeries.push(high1 - low1 > 0 ? ((m - low1) / (high1 - low1)) * 100 : stoKSeries.slice(-1)[0] || 0) // f1

      const currentStoK = stoKSeries.slice(-1)[0]
      const prevSmoothedStoK = smoothedStoKSeries.slice(-1)[0]

      smoothedStoKSeries.push(
        !prevSmoothedStoK ? currentStoK : prevSmoothedStoK + factor * (currentStoK - prevSmoothedStoK) // pf
      )

      const xsmoothedStoKSeries = smoothedStoKSeries.slice(-length)

      const low2 = Math.min(...xsmoothedStoKSeries) // v3
      const high2 = Math.max(...xsmoothedStoKSeries) // v4

      const currentSmoothedStoK = smoothedStoKSeries.slice(-1)[0]

      stoDSeries.push(
        high2 - low2 > 0
          ? ((currentSmoothedStoK - low2) / (high2 - low2)) * 100
          : stoDSeries.slice(-1)[0] || 0
      ) // pff

      const currentStoD = stoDSeries.slice(-1)[0]
      const prevSmoothedStoD = smoothedStoDSeries.slice(-1)[0]

      smoothedStoDSeries.push(
        !prevSmoothedStoD ? currentStoD : prevSmoothedStoD + factor * (currentStoD - prevSmoothedStoD)
      )
    })

    return smoothedStoDSeries
  },
}
