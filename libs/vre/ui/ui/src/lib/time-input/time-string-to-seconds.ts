export function timeStringToSeconds(time: string): number | null {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }
  const [, hoursStr, minutesStr, secondsStr] = match;
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const seconds = Number(secondsStr);

  if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}
