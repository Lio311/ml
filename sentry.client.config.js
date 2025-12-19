import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://2b7924ed561cb89202c7eaeb52416637@o4510558637785088.ingest.de.sentry.io/4510558639620176",

    // Replay may only be available for the client
    integrations: [
        Sentry.replayIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});
