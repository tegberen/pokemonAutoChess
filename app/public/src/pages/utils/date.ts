import i18n from "../../i18n"

export function formatDate(
  date: number | Date,
  params: Intl.DateTimeFormatOptions = {}
) {
  if (typeof date === "number") date = new Date(date)
  try {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
      ...params
    }).format(date)
  } catch (err) {
    return "Invalid Date"
  }
}

const RELATIVE_DATE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86400_000],
  ["hour", 3600_000],
  ["minute", 60_000]
]

export function formatRelativeDate(date: number | Date) {
  const time = typeof date === "number" ? date : date.getTime()
  const elapsed = Date.now() - time
  try {
    const formatter = new Intl.RelativeTimeFormat(i18n.language, {
      numeric: "auto",
      style: "narrow"
    })
    for (const [unit, milliseconds] of RELATIVE_DATE_UNITS) {
      if (elapsed >= milliseconds) {
        return formatter.format(-Math.floor(elapsed / milliseconds), unit)
      }
    }
    return formatter.format(-1, "minute")
  } catch (err) {
    return formatDate(date)
  }
}

export function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400)
  seconds -= days * 86400
  const hours = Math.floor(seconds / 3600)
  seconds -= hours * 3600
  const minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  //@ts-ignore: https://github.com/microsoft/TypeScript/issues/60608
  if (Intl && Intl.DurationFormat) {
    //@ts-ignore: https://github.com/microsoft/TypeScript/issues/60608
    return new Intl.DurationFormat(i18n.language, { style: "long" }).format({
      days,
      hours,
      minutes,
      seconds
    })
  }
  return `${days > 0 ? days + " days" : ""}${hours > 0 ? hours + " hours" : ""}${minutes > 0 ? minutes + " min" : ""}${seconds > 0 ? seconds + " s" : ""}`.trim()
}

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000

export function formatTimeLeft(msLeft: number) {
  const days = Math.floor(msLeft / MS_PER_DAY)
  const hours = Math.floor((msLeft % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((msLeft % MS_PER_HOUR) / MS_PER_MINUTE)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
