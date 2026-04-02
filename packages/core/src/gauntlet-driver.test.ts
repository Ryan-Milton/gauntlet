import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GauntletDriver } from './gauntlet-driver.js';
import type { IDriver } from './driver.interface.js';
import type { GauntletElement } from './types.js';

function createMockElement(overrides: Partial<GauntletElement> = {}): GauntletElement {
  return {
    text: vi.fn().mockResolvedValue('Hello'),
    value: vi.fn().mockResolvedValue(''),
    isVisible: vi.fn().mockResolvedValue(true),
    isEnabled: vi.fn().mockResolvedValue(true),
    tap: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    getAttribute: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function createMockDriver(overrides: Partial<IDriver> = {}): IDriver {
  return {
    launch: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    tap: vi.fn().mockResolvedValue(undefined),
    doubleTap: vi.fn().mockResolvedValue(undefined),
    longPress: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    scroll: vi.fn().mockResolvedValue(undefined),
    swipe: vi.fn().mockResolvedValue(undefined),
    find: vi.fn().mockResolvedValue(createMockElement()),
    findAll: vi.fn().mockResolvedValue([createMockElement()]),
    waitFor: vi.fn().mockResolvedValue(undefined),
    waitForAbsence: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
    executeScript: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn().mockResolvedValue(undefined),
    back: vi.fn().mockResolvedValue(undefined),
    forward: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    interceptRequest: vi.fn().mockResolvedValue(undefined),
    mockResponse: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('GauntletDriver', () => {
  let gauntlet: GauntletDriver;
  let mockDriver: IDriver;

  beforeEach(() => {
    gauntlet = new GauntletDriver({ surface: 'web' });
    mockDriver = createMockDriver();
    gauntlet.use(mockDriver);
  });

  it('throws when no driver is registered', async () => {
    const bare = new GauntletDriver({ surface: 'web' });
    await expect(bare.launch('https://example.com')).rejects.toThrow('No driver registered');
  });

  it('delegates launch to the driver', async () => {
    await gauntlet.launch('https://example.com');
    expect(mockDriver.launch).toHaveBeenCalledWith('https://example.com');
  });

  it('resolves testId selectors before passing to driver', async () => {
    await gauntlet.tap({ testId: 'my-btn' });
    expect(mockDriver.tap).toHaveBeenCalledWith('[data-testid="my-btn"]');
  });

  it('assertVisible passes for visible elements', async () => {
    await expect(gauntlet.assertVisible('#btn')).resolves.toBeUndefined();
  });

  it('assertVisible throws for hidden elements', async () => {
    const hidden = createMockElement({ isVisible: vi.fn().mockResolvedValue(false) });
    (mockDriver.find as ReturnType<typeof vi.fn>).mockResolvedValue(hidden);
    await expect(gauntlet.assertVisible('#btn')).rejects.toThrow('Expected element to be visible');
  });

  it('assertText passes for matching text', async () => {
    await expect(gauntlet.assertText('#el', 'Hello')).resolves.toBeUndefined();
  });

  it('assertText throws for non-matching text', async () => {
    await expect(gauntlet.assertText('#el', 'Goodbye')).rejects.toThrow(
      'Expected text "Goodbye" but got "Hello"'
    );
  });

  it('assertText supports RegExp', async () => {
    await expect(gauntlet.assertText('#el', /Hell/)).resolves.toBeUndefined();
    await expect(gauntlet.assertText('#el', /^Goodbye$/)).rejects.toThrow();
  });

  it('navigate throws on non-web surfaces when driver lacks navigate', async () => {
    const iosGauntlet = new GauntletDriver({ surface: 'ios' });
    const noNavDriver = createMockDriver();
    delete noNavDriver.navigate;
    iosGauntlet.use(noNavDriver);
    await expect(iosGauntlet.navigate('https://example.com')).rejects.toThrow('not supported');
  });

  it('delegates screenshot to the driver', async () => {
    const buf = await gauntlet.screenshot('test');
    expect(mockDriver.screenshot).toHaveBeenCalledWith('test');
    expect(buf).toBeInstanceOf(Buffer);
  });
});
