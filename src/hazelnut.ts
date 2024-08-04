import { encrypt } from "@mongez/encryption";
import Endpoint from "@mongez/http";
import { GenericObject, Random } from "@mongez/reinforcements";
import ErrorStackParser from "error-stack-parser";
import {
  captureGlobalErrors,
  detectPageLeave,
  getBrowserInfo,
  getOperatingSystemInfo,
} from "./collect-browser-data";
import { parseStackTraceFromSourcemap } from "./error-stack-sourcemap";
import { HazelnutOptions } from "./types";

class IndexedDB {
  static dbName = "hazelnutDB";
  static dbVersion = 1;
  static eventStore = "events";
  static errorStore = "errors";

  static openDB() {
    // ignore DB for now
    return;
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(IndexedDB.dbName, IndexedDB.dbVersion);
      request.onerror = (event) => {
        reject(`Error opening IndexedDB: ${event.target}`);
      };
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IndexedDB.eventStore)) {
          db.createObjectStore(IndexedDB.eventStore, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains(IndexedDB.errorStore)) {
          db.createObjectStore(IndexedDB.errorStore, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
    });
  }

  static async save(storeName: string, data: any) {
    // ignore DB for now
    return;
    const db = await IndexedDB.openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) =>
        reject(`Error saving data: ${event.target}`);
      const store = transaction.objectStore(storeName);
      store.add(data);
    });
  }

  static async getAll(storeName: string) {
    // ignore DB for now
    return;
    const db = await IndexedDB.openDB();
    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      transaction.onerror = (event) =>
        reject(`Error fetching data: ${event.target}`);
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) =>
        reject(`Error fetching data: ${event.target}`);
    });
  }

  static async delete(storeName: string, id: number) {
    // ignore DB for now
    return;
    const db = await IndexedDB.openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) =>
        reject(`Error deleting data: ${event.target}`);
      const store = transaction.objectStore(storeName);
      store.delete(id);
    });
  }
}

export class Hazelnut {
  /**
   * API URL
   */
  protected apiUrl = "https://api.hazelnut.mentoor.io";

  /**
   * API Request
   */
  protected request: Endpoint;

  /**
   * Session ID
   */
  public sessionId!: string;

  /**
   * Determine whether the app is initialized or not
   */
  public initialized = false;

  /**
   * Last activity time
   */
  public lastActivity?: number;

  /**
   * console error original method
   */
  protected consoleErrorMethod = console.error;

  /**
   * Create a singleton instance of Hazelnut
   */
  protected static instance: Hazelnut;

  /**
   * Queue to store events and errors until the Hazelnut instance is initialized
   */
  protected queue: {
    type: "event" | "error";
    data: any;
  }[] = [];

  protected options: HazelnutOptions;

  /**
   * Constructor
   * @param options Configuration options for Hazelnut
   */
  private constructor() {}

  /**
   * Get the singleton instance of Hazelnut
   */
  public static getInstance() {
    if (!Hazelnut.instance) {
      Hazelnut.instance = new Hazelnut();
    }

    return Hazelnut.instance;
  }

  /**
   * Configure the Hazelnut instance
   */
  public static init(options: HazelnutOptions) {
    return Hazelnut.getInstance().configure(options);
  }

  /**
   * Initialize the tracker
   */
  public configure(options: HazelnutOptions) {
    this.options = options;

    if (this.options?.apiUrl) {
      this.apiUrl = this.options.apiUrl;
    }

    this.request = new Endpoint({
      baseURL: this.apiUrl,
    });

    this.prepareSessionId();

    if (this.options.captureUncaughtErrors) {
      captureGlobalErrors(this);
      this.overrideConsoleError();
    }

    detectPageLeave(this);

    this.retryFailedRequests();
    window.addEventListener("online", this.retryFailedRequests.bind(this));
    // Start periodic checks
    this.startPeriodicCheck();

    return this;
  }

  protected startPeriodicCheck() {
    // const interval = this.options.retryInterval || 60000; // Default to 1 minute
    const interval = 60000; // Default to 1 minute
    setInterval(() => {
      this.retryFailedRequests();
    }, interval);
  }

  /**
   * Override the console.error method to track errors
   */
  protected overrideConsoleError() {
    console.error = (...args: any[]) => {
      // Call the original console.error method
      console.log("err", args);

      this.consoleErrorMethod.apply(console, args);

      // Track the error using the Hazelnut error method
      this.error(args[0]);
    };
  }

  /**
   * Terminate the current session
   */
  public terminateSession() {
    if (!this.initialized) {
      return;
    }

    this.track("session.ended");

    localStorage.removeItem("hzlsid");
    localStorage.removeItem("hzlsat");

    this.lastActivity = undefined;
  }

  /**
   * Retry sending failed requests from IndexedDB
   */
  protected async retryFailedRequests() {
    if (navigator.onLine) {
      const failedEvents = await IndexedDB.getAll(IndexedDB.eventStore);
      const failedErrors = await IndexedDB.getAll(IndexedDB.errorStore);

      for (const event of failedEvents) {
        try {
          await this.send("event", event);
          await IndexedDB.delete(IndexedDB.eventStore, event.id);
        } catch (error) {
          this.consoleErrorMethod("Retrying failed event:", error);
        }
      }

      for (const error of failedErrors) {
        try {
          await this.send("error", error);
          await IndexedDB.delete(IndexedDB.errorStore, error.id);
        } catch (error) {
          this.consoleErrorMethod("Retrying failed error:", error);
        }
      }
    }
  }

  protected async processQueue() {
    // Process the queue
    for (const [key, item] of this.queue.entries()) {
      try {
        if (item.type === "event") {
          await this.send("event", item.data);
        } else {
          await this.send("error", item.data);
        }

        // remove the item from queue
        delete this.queue[key];
      } catch (error) {
        // TODO: move to database
        this.consoleErrorMethod(error);
      }
    }
  }

  /**
   * Log an error
   * @param error Error object or message to log
   */
  public async error(error: Error, data?: GenericObject) {
    const stack = ErrorStackParser.parse(error);

    const finalStack = this.options.sourcemap
      ? await parseStackTraceFromSourcemap(
          stack,
          this.options.sourceMapUrlParser
        )
      : stack;

    const errorData = {
      title: error.message,
      trace: error.stack,
      stack: finalStack,
      data,
      ...this.prepareData(),
    };

    if (!this.initialized) {
      this.queue.push({
        type: "error",
        data: errorData,
      });

      return;
    }

    this.updateLastActivity();

    this.send("error", errorData);
  }

  /**
   * Send the given data
   */
  protected async send(type: "event" | "error", data: GenericObject) {
    try {
      const path = type === "event" ? "/events/collect" : "/errors/collect";

      const encryptedData: string = encrypt(
        data,
        this.options.encryptionKey || "hazelnutKey"
      );

      this.request
        .post(path, {
          p: encryptedData, // p for payload
        })
        .catch(() => {
          IndexedDB.save(
            type === "event" ? IndexedDB.eventStore : IndexedDB.errorStore,
            data
          );
        });
    } catch (error) {
      this.consoleErrorMethod("Error sending data:", error);
    }
  }

  /**
   * Log an error
   * @param error Error object or message to log
   */
  public warning(error: Error) {
    const warningData = {
      title: error.message,
      trace: error.stack,
      severity: "warning",
      stack: ErrorStackParser.parse(error),
      ...this.prepareData(),
    };

    if (!this.initialized) {
      this.queue.push({
        type: "error",
        data: warningData,
      });
      return;
    }

    this.updateLastActivity();

    this.send("error", warningData);
  }

  /**
   * Track an event
   * @param event Event name
   * @param data Optional event data
   */
  public async track(event: string, data?: any) {
    const eventData = {
      name: event,
      data,
      ...this.prepareData(),
    };
    if (this.options.onTrack) {
      this.options.onTrack(event, data);
    }

    if (!this.initialized) {
      this.queue.push({
        type: "event",
        data: eventData,
      });

      return;
    }

    this.updateLastActivity();

    try {
      await this.send("event", eventData);
    } catch (error) {
      this.consoleErrorMethod("Error tracking event:", error);
      IndexedDB.save(IndexedDB.eventStore, eventData);
    }
  }

  /**
   * Prepare the session ID
   */
  protected async prepareSessionId() {
    try {
      this.sessionId = localStorage.getItem("hzlsid") || "";
      this.lastActivity = Number(localStorage.getItem("hzlsat")) || 0;

      if (!this.sessionId) {
        await this.generateSessionId();
      }

      this.markAsInitialized();

      this.checkSessionTimeoutInterval();
    } catch (error) {
      this.consoleErrorMethod("Error preparing session ID:", error);
    }
  }

  /**
   * Mark the tracker as initialized
   */
  protected markAsInitialized() {
    this.initialized = true;

    this.processQueue();
  }

  /**
   * Check the session timeout interval
   * Uses debouncing to prevent excessive checking
   */
  protected checkSessionTimeoutInterval() {
    // Use debouncing to prevent excessive calls
    let timeoutId: NodeJS.Timeout;
    const debounceInterval = 10000; // 10 seconds

    const debounceCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.checkSessionTimeout();
      }, debounceInterval);
    };

    setInterval(debounceCheck, debounceInterval);
  }

  /**
   * Check if the session has timed out
   */
  protected async checkSessionTimeout() {
    if (!this.lastActivity) {
      return;
    }

    const timeout = this.options.sessionTimeout || 30 * 60 * 1000;

    if (Date.now() - this.lastActivity > timeout) {
      await this.track("session.timeout");
      await this.generateSessionId(); // Ensure this is awaited
    }

    if (this.options.newDayNewSession) {
      const lastActivity = new Date(this.lastActivity);
      const now = new Date();

      if (lastActivity.getDate() !== now.getDate()) {
        await this.track("session.timeout");
        await this.generateSessionId(); // Ensure this is awaited
      }
    }
  }

  /**
   * Generate a new session ID
   */
  protected async generateSessionId() {
    try {
      this.sessionId = Random.string(64);
      await this.track("session.started");
      localStorage.setItem("hzlsid", this.sessionId);
    } catch (error) {
      this.consoleErrorMethod("Error generating session ID:", error);
    }
  }

  /**
   * Update the last activity time
   */
  protected updateLastActivity() {
    this.lastActivity = Date.now();
    localStorage.setItem("hzlsat", this.lastActivity.toString());
  }

  /**
   * Prepare the data to be sent with events
   * @returns Prepared data object
   */
  protected prepareData() {
    return {
      sessionId: this.sessionId,
      version: this.options.version,
      apiKey: this.options.apiKey,
      timestamp: Date.now(),
      environment: this.options.environment || "production",
      user: this.options.user ? this.options.user : undefined,
      browser: getBrowserInfo(),
      language: navigator.language,
      os: getOperatingSystemInfo(),
      ui: {
        darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        displayMode: window.matchMedia("(orientation: portrait)").matches
          ? "portrait"
          : "landscape",
      },
      request: {
        title: document.title,
        userAgent: navigator.userAgent,
        url: window.location.href,
        origin: window.location.origin,
        path: window.location.pathname,
        queryParams: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer,
      },
    };
  }
}

interface HazelnutInstanceHelper {
  (options?: HazelnutOptions): Hazelnut;
  init: (options: HazelnutOptions) => Hazelnut;
  track: (event: string, data?: any) => void;
  error: (error: Error) => void;
  terminate: () => void;
}

export const hazelnut: HazelnutInstanceHelper = (options?: HazelnutOptions) => {
  return Hazelnut.getInstance(options);
};

hazelnut.track = (event: string, data?: any) => {
  return Hazelnut.getInstance().track(event, data);
};

hazelnut.error = (error: Error, data?: GenericObject) => {
  return Hazelnut.getInstance().error(error, data);
};

hazelnut.terminate = () => {
  return Hazelnut.getInstance().terminateSession();
};

hazelnut.init = (options: HazelnutOptions) => {
  return Hazelnut.getInstance().configure(options);
};
