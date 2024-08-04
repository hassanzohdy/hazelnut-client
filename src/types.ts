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
  environment?: "development" | "production" | "staging";
  /**
   * Enable sourcemap
   * If true, errors will be mapped to the original source code
   *
   * @default false
   */
  sourcemap?: boolean;
  /**
   * Source map url parser
   *
   * @default file => file + ".map"
   */
  sourceMapUrlParser?: (file: string) => string;
};
