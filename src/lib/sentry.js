import * as Sentry from '@sentry/nextjs'

export function captureAPIError(error, context = {}) {
  Sentry.withScope(scope => {
    if (context.requestId) scope.setTag('requestId', context.requestId)
    if (context.endpoint) scope.setTag('endpoint', context.endpoint)

    scope.setExtras({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...context,
    })

    Sentry.captureException(error)
  })
}

export function captureSecurityEvent(event, details = {}) {
  Sentry.withScope(scope => {
    scope.setLevel('warning')
    scope.setTag('security_event', event)
    scope.setTag('endpoint', details.endpoint || 'unknown')

    scope.setExtras({
      event_type: event,
      ip_hash: details.ip ? details.ip.substring(0, 8) + '***' : 'unknown',
      origin: details.origin || 'unknown',
      timestamp: new Date().toISOString(),
      ...details,
    })

    Sentry.captureMessage(`Security Event: ${event}`, 'warning')
  })
}
