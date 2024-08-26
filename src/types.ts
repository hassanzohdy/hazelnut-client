type UserInfo = {
  [key: string]: any;
};

export type HazelnutOptions = {
  /**
   * APi key
   */
  apiKey: string;
  /**
   * Set the base api url
   * @default "https://api.hazelnut.mentoor.io/v1"
   */
  apiUrl?: string;
  /**
   * Encryption key
   */
  encryptionKey?: string;
  /**
   * Specify the user data
   */
  user?: UserInfo;
  /**
   * Determine what to be auto collected
   */
  autoCollect?: {
    /**
     * Collect when user navigates to a new page
     *
     * @default true
     */
    navigation?: boolean;
    /**
     * Collect when user closes the web app
     *
     * @default true
     */
    close?: boolean;
  };
  /**
   * Capture unhandled errors
   *
   * @default true
   */
  captureUncaughtErrors?: boolean;
  /**
   * Session time out from last activity to start a new session
   * Value in seconds
   * @default 30 minutes
   */
  sessionTimeout?: number;
  /**
   * Start a new session on a new day
   *
   * @default false
   */
  newDayNewSession?: boolean;
  /**
   * Current app version
   */
  version?: string;
  /**
   * Whether to track warnings
   * @default false
   */
  trackWarnings?: boolean;
  /**
   * Listen to tracked events
   */
  onTrack?: (event: string, data: any) => void;
  /**
   * Application environment
   */
  environment?: "development" | "production" | "staging" | "local";
};
