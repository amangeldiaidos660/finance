export function errorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code.includes('permission-denied')) { return 'Нет доступа к вашим данным. Повторите вход. Если ошибка сохраняется, обратитесь к поддержке.'; }
  if (code.includes('unavailable') || code.includes('network-request-failed')) { return 'Нет соединения с сервером. Подключитесь к интернету и повторите сохранение.'; }
  if (code.includes('unauthenticated') || code.includes('user-token-expired')) { return 'Сессия завершилась. Войдите в Google-аккаунт повторно.'; }
  if (code.includes('resource-exhausted')) { return 'Облачный сервис достиг лимита запросов. Попробуйте позже.'; }
  if (code.includes('aborted')) { return 'Данные изменились на другом устройстве. Повторите операцию.'; }
  if (error instanceof Error) { return error.message; }
  return 'Не удалось выполнить действие. Повторите попытку.';
}
