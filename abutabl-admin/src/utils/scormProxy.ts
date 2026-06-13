/**
 * SCORM API Proxy Script - Injected into SCORM content to handle cross-origin communication
 * This script intercepts SCORM API calls and uses postMessage to communicate with the parent window
 */
const SCORM_API_PROXY_SCRIPT = `
(function() {
  'use strict';
  
  // Generate unique ID for this iframe
  const iframeId = 'scorm-iframe-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  let callIdCounter = 0;
  
  // Local storage for SCORM data (synchronous access)
  const scormStorage = {
    data: {},
    initialized: false,
    lastError: '0'
  };
  
  // Function to send API calls via postMessage (async, for actual persistence)
  function sendAPICallAsync(method, args) {
    const callId = callIdCounter++;
    window.parent.postMessage({
      type: 'SCORM_API_CALL',
      iframeId: iframeId,
      callId: callId,
      method: method,
      args: args
    }, '*');
  }
  
  // SCORM API stub object with synchronous methods
  const API = {
    LMSInitialize: function(param) {
      scormStorage.initialized = true;
      scormStorage.lastError = '0';
      sendAPICallAsync('LMSInitialize', [param]);
      return 'true';
    },
    LMSFinish: function(param) {
      sendAPICallAsync('LMSFinish', [param]);
      return 'true';
    },
    LMSGetValue: function(element) {
      // Return from local storage immediately (synchronous)
      const value = scormStorage.data[element] || '';
      sendAPICallAsync('LMSGetValue', [element]);
      return value;
    },
    LMSSetValue: function(element, value) {
      // Store locally immediately (synchronous)
      scormStorage.data[element] = value;
      scormStorage.lastError = '0';
      sendAPICallAsync('LMSSetValue', [element, value]);
      return 'true';
    },
    LMSCommit: function(param) {
      sendAPICallAsync('LMSCommit', [param]);
      return 'true';
    },
    LMSGetLastError: function() {
      return scormStorage.lastError;
    },
    LMSGetErrorString: function(errorCode) {
      sendAPICallAsync('LMSGetErrorString', [errorCode]);
      return 'No Error';
    },
    LMSGetDiagnostic: function(errorCode) {
      sendAPICallAsync('LMSGetDiagnostic', [errorCode]);
      return 'No Error';
    }
  };
  
  // Listen for responses from parent window to sync data
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SCORM_API_RESPONSE' && event.data.iframeId === iframeId) {
      const { callId, result, error, method, args } = event.data;
      
      // Update local storage based on response
      if (!error && result !== undefined) {
        if (method === 'LMSGetValue' && args && args[0]) {
          scormStorage.data[args[0]] = result;
        } else if (method === 'LMSGetLastError') {
          scormStorage.lastError = result;
        }
      } else if (error) {
        scormStorage.lastError = '101'; // General error
      }
    } else if (event.data && event.data.type === 'SCORM_DATA_SYNC' && event.data.iframeId === iframeId) {
      // Sync all data from parent
      if (event.data.data) {
        Object.assign(scormStorage.data, event.data.data);
      }
    }
  });
  
  // SCORM API discovery - try to find API in parent windows
  function findAPI(win) {
    try {
      if (win.API && win.API.LMSInitialize) {
        return win.API;
      }
      if (win.parent && win.parent !== win) {
        return findAPI(win.parent);
      }
      if (win.top && win.top !== win) {
        return findAPI(win.top);
      }
    } catch (e) {
      // Cross-origin error, continue searching
    }
    return null;
  }
  
  // Try to find existing API first
  let foundAPI = findAPI(window);
  
  // If no API found, use our proxy
  if (!foundAPI) {
    // Expose API on window object
    window.API = API;
    window.API_1484_11 = API; // SCORM 2004
    
    // Also try to set it on parent (will fail for cross-origin, but that's OK)
    try {
      if (window.parent && window.parent !== window) {
        window.parent.API = API;
        window.parent.API_1484_11 = API;
      }
    } catch (e) {
      // Cross-origin, ignore
    }
    
    try {
      if (window.top && window.top !== window) {
        window.top.API = API;
        window.top.API_1484_11 = API;
      }
    } catch (e) {
      // Cross-origin, ignore
    }
  } else {
    // Use found API
    window.API = foundAPI;
    window.API_1484_11 = foundAPI;
  }
  
  // Notify parent that SCORM API is ready
  window.parent.postMessage({
    type: 'SCORM_API_READY',
    iframeId: iframeId
  }, '*');
})();
`;

/**
 * Proxy function to get SCORM content URL
 * Returns the original URL without modifications
 */
export const getFixedScormUrl = async (originalUrl: string): Promise<string> => {
  // Simply return the original URL without any modifications
  return originalUrl;
};

/**
 * SCORM API implementation for the parent window
 * This provides a basic SCORM API that can be extended with actual LMS functionality
 */
export class ScormAPI {
  private data: Map<string, string> = new Map();
  
  LMSInitialize(param: string): string {
    this.data.clear();
    return 'true';
  }
  
  LMSFinish(param: string): string {
    return 'true';
  }
  
  LMSGetValue(element: string): string {
    return this.data.get(element) || '';
  }
  
  LMSSetValue(element: string, value: string): string {
    this.data.set(element, value);
    return 'true';
  }
  
  LMSCommit(param: string): string {
    return 'true';
  }
  
  LMSGetLastError(): string {
    return '0';
  }
  
  LMSGetErrorString(errorCode: string): string {
    return 'No Error';
  }
  
  LMSGetDiagnostic(errorCode: string): string {
    return 'No Error';
  }
  
  handleAPICall(method: string, args: any[]): any {
    switch (method) {
      case 'LMSInitialize':
        return this.LMSInitialize(args[0] || '');
      case 'LMSFinish':
        return this.LMSFinish(args[0] || '');
      case 'LMSGetValue':
        return this.LMSGetValue(args[0] || '');
      case 'LMSSetValue':
        return this.LMSSetValue(args[0] || '', args[1] || '');
      case 'LMSCommit':
        return this.LMSCommit(args[0] || '');
      case 'LMSGetLastError':
        return this.LMSGetLastError();
      case 'LMSGetErrorString':
        return this.LMSGetErrorString(args[0] || '');
      case 'LMSGetDiagnostic':
        return this.LMSGetDiagnostic(args[0] || '');
      default:
        throw new Error(`Unknown SCORM API method: ${method}`);
    }
  }
}

/**
 * Set up SCORM API message handler in the parent window
 * Call this once when the app initializes
 */
export function setupScormAPIHandler(api?: ScormAPI): void {
  const scormAPI = api || new ScormAPI();
  
  window.addEventListener('message', (event) => {
    // Only handle messages from our own origin or trusted origins
    // In production, you should validate event.origin
    if (event.data && event.data.type === 'SCORM_API_CALL') {
      const { iframeId, callId, method, args } = event.data;
      
      try {
        const result = scormAPI.handleAPICall(method, args);
        
        // Send response back to iframe
        const iframe = Array.from(document.querySelectorAll('iframe')).find(
          (frame) => frame.contentWindow === event.source
        );
        
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'SCORM_API_RESPONSE',
            iframeId: iframeId,
            callId: callId,
            method: method,
            args: args,
            result: result
          }, '*');
        }
      } catch (error: any) {
        // Send error response
        const iframe = Array.from(document.querySelectorAll('iframe')).find(
          (frame) => frame.contentWindow === event.source
        );
        
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'SCORM_API_RESPONSE',
            iframeId: iframeId,
            callId: callId,
            method: method,
            args: args,
            error: error.message || 'Unknown error'
          }, '*');
        }
      }
    }
  });
}
