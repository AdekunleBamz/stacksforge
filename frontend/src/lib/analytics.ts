type EventName =
    | 'connect_wallet'
    | 'disconnect_wallet'
    | 'forge_token_start'
    | 'forge_token_success'
    | 'forge_token_error'
    | 'view_token_list'
    | 'click_explorer';

interface EventProperties {
    [key: string]: string | number | boolean | undefined;
}

const IS_PROD = process.env.NODE_ENV === 'production';

export function trackEvent(name: EventName, properties?: EventProperties) {
    if (IS_PROD) {
        // In a real app, send to Mixpanel/Amplitude/Google Analytics
        // For now, we'll just log to console in dev, or suppress in prod
        // potentially sending to a privacy-preserving endpoint
        try {
            // navigator.sendBeacon('/api/analytics', JSON.stringify({ name, properties }));
        } catch (e) {
            // ignore
        }
    } else {
        console.log(`[Analytics] ${name}`, properties);
    }
}
