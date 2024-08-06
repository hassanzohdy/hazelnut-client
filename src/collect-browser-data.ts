import type { Hazelnut } from "./hazelnut";

declare global {
  interface Window {
    startedAt: number;
    previousPath: string;
  }
}

/**
 * @TODO: Implement the Page Visibility API
 * The beforeunload event is a little bit old, we need to sue the newer Page Visibility API which is
 * `visibilitychange` event with navigator.sendBeacon to send the data
 */
export function detectPageLeave(hazelnut: Hazelnut): void {
  window.addEventListener("beforeunload", () => {
    hazelnut.track("app.closed");
  });
}

export function getBrowserInfo(): { name: string; version: string } {
  const { userAgent } = navigator;
  let browserName;
  let browserVersion;

  // Detect Chrome
  if (userAgent.indexOf("Chrome") !== -1) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1];
  }
  // Detect Firefox
  else if (userAgent.indexOf("Firefox") !== -1) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1];
  }
  // Detect Safari
  else if (userAgent.indexOf("Safari") !== -1) {
    browserName = "Safari";
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1];
  }
  // Detect Edge
  else if (userAgent.indexOf("Edg") !== -1) {
    browserName = "Edge";
    browserVersion = userAgent.match(/Edg\/(\d+)/)?.[1];
  }
  // Detect Internet Explorer
  else if (userAgent.indexOf("Trident") !== -1) {
    browserName = "Internet Explorer";
    browserVersion = userAgent.match(/rv:(\d+)/)?.[1];
  }
  // Default to unknown
  else {
    browserName = "Unknown";
    browserVersion = "Unknown";
  }

  return {
    name: browserName,
    version: browserVersion!,
  };
}

export function getOperatingSystemInfo(): {
  name: string;
  version: string;
  type: string;
} {
  const { userAgent } = navigator;
  let osName = "Unknown";
  let osVersion = "Unknown";
  let deviceType = "Unknown";

  // Detect Android
  if (userAgent.indexOf("Android") !== -1) {
    osName = "Android";
    osVersion = userAgent.match(/Android (\d+[_.\d]+)/)?.[1] || "Unknown";
    deviceType = /Mobile/.test(userAgent) ? "mobile" : "tablet";
  }
  // Detect iOS
  else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    osName = "iOS";
    osVersion =
      userAgent.match(/OS (\d+[_.\d]+)/)?.[1].replace(/_/g, ".") || "Unknown";
    deviceType = /iPad/.test(userAgent) ? "tablet" : "mobile";
  }
  // Detect Windows
  else if (userAgent.indexOf("Windows") !== -1) {
    osName = "Windows";
    osVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] || "Unknown";
    deviceType = "desktop";
  }
  // Detect macOS
  else if (
    userAgent.indexOf("Macintosh") !== -1 ||
    userAgent.indexOf("Mac OS X") !== -1
  ) {
    osName = "macOS";
    osVersion =
      userAgent.match(/Mac OS X (\d+[_.\d]+)/)?.[1].replace(/_/g, ".") ||
      "Unknown";
    deviceType = "desktop";
  }
  // Detect Linux
  else if (userAgent.indexOf("Linux") !== -1) {
    osName = "Linux";
    osVersion = "Unknown";
    deviceType = "desktop";
  }
  // Detect Chrome OS
  else if (userAgent.indexOf("CrOS") !== -1) {
    osName = "Chrome OS";
    osVersion = userAgent.match(/CrOS\s[^\s]+\s([\d]+)/)?.[1] || "Unknown";
    deviceType = "desktop";
  }

  return {
    name: osName,
    version: osVersion,
    type: deviceType,
  };
}

export function captureGlobalErrors(hazelnut: Hazelnut): void {
  window.addEventListener("error", async (event: ErrorEvent) => {
    const { error } = event;

    hazelnut.uncaughtError(error);
  });

  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Error) {
        hazelnut.uncaughtError(event.reason);
      } else {
        // Create a new error object for non-error reasons

        const error = new Error(event.reason);
        hazelnut.uncaughtError(error, {
          reason: event.reason,
        });
      }
    }
  );
}
