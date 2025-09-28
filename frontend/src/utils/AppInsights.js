import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: '29853f26-ec99-48a5-bc53-cf52c0a57845',
    disableAjaxTracking: true,
    disableFetchTracking: true,
    disableExceptionTracking: true,
    enableAutoRouteTracking: false,
    samplingPercentage: 100, // Reduce to 50 or 10 if you want less data
  }
});


appInsights.loadAppInsights();

export default appInsights;