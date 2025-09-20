'use client';

import { datadogRum } from '@datadog/browser-rum';
import { useEffect } from 'react';

// Global flag to prevent multiple initializations
declare global {
  var __DATADOG_INITIALIZED__: boolean | undefined;
}

export default function DatadogInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__DATADOG_INITIALIZED__) {
      const applicationId = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
      const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;

      // Only initialize if both required env vars are present and not already initialized
      if (applicationId && clientToken && !datadogRum.getInitConfiguration()) {
        try {
          datadogRum.init({
            applicationId,
            clientToken,
            // site: 'datadoghq.com',
            service: 'mcp-chat',
            env: process.env.NODE_ENV || 'development',
            // Specify a version number to identify the deployed version of your application in Datadog
            // version: '1.0.0',
            sessionSampleRate: 100,
            sessionReplaySampleRate: 20,
            trackUserInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            defaultPrivacyLevel: 'mask-user-input',
          });
          // Mark as initialized to prevent future attempts
          window.__DATADOG_INITIALIZED__ = true;
        } catch (error) {
          console.warn('Datadog initialization failed:', error);
        }
      }
    }
  }, []); // Empty dependency array ensures this only runs once

  return null;
}