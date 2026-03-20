/** Parses a `42[...]` Socket.IO packet body and dispatches to the handler. */
export function dispatchLovenseSioDataMessage(
  message: string,
  onEvent: (event: string, payload: unknown) => void
): void {
  if (!message.startsWith('42')) return;

  try {
    const data = JSON.parse(message.substring(2)) as [string, unknown];
    const event = data[0];
    let payload = data[1];
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // ignore malformed payload and pass through string
      }
    }
    onEvent(event, payload);
  } catch (error) {
    console.error('Error parsing SIO message', error);
  }
}
