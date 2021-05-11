import { startOfMinute } from 'date-fns'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import startOfHour from 'date-fns/startOfHour'

export const formatInterval = (minutes: number) => {
  let intervalString = `${minutes}m`
  switch (minutes) {
    case 60:
      intervalString = '1h'
      break
    case 6 * 60:
      intervalString = '6h'
      break
    case 24 * 60:
      intervalString = '1D'
      break
    default:
      break
  }
  return intervalString
}

export const roundDownTo = (roundTo: number) => (x: number) => new Date(Math.floor(x / roundTo) * roundTo)

export const getScheduledTime = (period: number) => {
  const timeNow = new Date()
  const minutes = period / 60

  let scheduledTime = startOfMinute(add(timeNow, { minutes: 1 }))
  let repeatFrequency = 'one minute'

  const roundDownTo = (roundTo: number) => (x: number) => new Date(Math.floor(x / roundTo) * roundTo)

  if (minutes === 5) {
    scheduledTime = roundDownTo(5 * 60 * 1000)(add(timeNow, { minutes: 5 }).getTime())
    repeatFrequency = 'five minutes'
  } else if (minutes === 15) {
    scheduledTime = roundDownTo(15 * 60 * 1000)(add(timeNow, { minutes: 15 }).getTime())
    repeatFrequency = 'fifteen minutes'
  } else if (minutes === 60) {
    scheduledTime = startOfHour(add(timeNow, { hours: 1 }))
    repeatFrequency = 'hour'
  } else if (minutes === 6 * 60) {
    scheduledTime = startOfHour(add(timeNow, { hours: 6 }))
    repeatFrequency = 'six hours'
  } else if (minutes === 24 * 60) {
    scheduledTime = startOfDay(add(timeNow, { days: 1 }))
    repeatFrequency = 'one day'
  }

  return {
    scheduledTime,
    repeatFrequency,
  }
}
