import type { GauntletElement, MockResponse, RecordingOptions, RequestHandler, WaitOptions } from './types.js';

export interface IDriver {
  launch(target: string): Promise<void>;
  close(): Promise<void>;
  tap(selector: string): Promise<void>;
  doubleTap(selector: string): Promise<void>;
  longPress(selector: string, duration?: number): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  clear(selector: string): Promise<void>;
  scroll(direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void>;
  swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void>;
  find(selector: string): Promise<GauntletElement>;
  findAll(selector: string): Promise<GauntletElement[]>;
  waitFor(selector: string, options?: WaitOptions): Promise<void>;
  waitForAbsence(selector: string, options?: WaitOptions): Promise<void>;
  screenshot(name?: string): Promise<Buffer>;
  executeScript<T>(script: string, ...args: unknown[]): Promise<T>;

  // Recording
  startRecording(options?: RecordingOptions): Promise<void>;
  stopRecording(outputPath?: string): Promise<string>;

  // Optional — web/electron only
  navigate?(url: string): Promise<void>;
  back?(): Promise<void>;
  forward?(): Promise<void>;
  reload?(): Promise<void>;
  interceptRequest?(pattern: string, handler: RequestHandler): Promise<void>;
  mockResponse?(pattern: string, response: MockResponse): Promise<void>;
}
