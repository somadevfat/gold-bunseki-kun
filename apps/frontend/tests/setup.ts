import { GlobalWindow } from 'happy-dom';
import { server } from './mocks/server';
import { afterAll, afterEach, beforeAll } from 'bun:test';

const window = new GlobalWindow();
global.window = window as unknown as Window & typeof globalThis;
global.document = window.document as unknown as Document;
global.navigator = window.navigator as unknown as Navigator;
global.Event = window.Event as unknown as typeof Event;
global.CustomEvent = window.CustomEvent as unknown as typeof CustomEvent;
global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
global.HTMLDivElement = window.HTMLDivElement as unknown as typeof HTMLDivElement;

// MSW Setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
