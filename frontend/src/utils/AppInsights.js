import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: '45ce53aa-64b0-4188-9f03-2e16a20f894f',
    disableAjaxTracking: true,
    disableFetchTracking: true,
    disableExceptionTracking: true,
    enableAutoRouteTracking: false,
    samplingPercentage: 100, // Reduce to 50 or 10 if you want less data
  }
});


appInsights.loadAppInsights();

export default appInsights;