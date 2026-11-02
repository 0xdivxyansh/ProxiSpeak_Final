/**
 * Final Proxispeak - Keyboard Controller Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyboardController } from '../canvas/input/keyboardController.js';

describe('KeyboardController', () => {
  let controller;

  beforeEach(() => {
    controller = new KeyboardController();
    controller.attach();
  });

  afterEach(() => {
    controller.detach();
  });

  it('exposes getInput method returning all false initially', () => {
    expect(typeof controller.getInput).toBe('function');
    const input = controller.getInput();
    expect(input).toEqual({
      up: false,
      down: false,
      left: false,
      right: false
    });
  });

  it('correctly tracks WASD and Arrow key presses in getInput()', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

    const input = controller.getInput();
    expect(input.up).toBe(true);
    expect(input.left).toBe(true);
    expect(input.down).toBe(false);
    expect(input.right).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    const afterUp = controller.getInput();
    expect(afterUp.up).toBe(false);
    expect(afterUp.left).toBe(true);
  });

  it('clears all active keys on window blur', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    expect(controller.getInput().right).toBe(true);

    window.dispatchEvent(new Event('blur'));
    expect(controller.getInput().right).toBe(false);
  });
});

