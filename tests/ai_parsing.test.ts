import { describe, it, expect } from 'vitest';

// Mock function for AI action parsing logic
function parseAIAction(response: string) {
  if (response.includes('EVACUATE')) return 'EVAC_TRIGGER';
  if (response.includes('DISPATCH')) return 'DISPATCH_UNIT';
  return 'GENERAL_CHAT';
}

describe('AI Action Parsing Logic', () => {
  it('should identify evacuation triggers from Gemini responses', () => {
    const response = "Multiple alerts detected. We must EVACUATE sector 4 immediately.";
    expect(parseAIAction(response)).toBe('EVAC_TRIGGER');
  });

  it('should identify unit dispatch requests', () => {
    const response = "Copy that. I will DISPATCH Unit 7 to the North Gate.";
    expect(parseAIAction(response)).toBe('DISPATCH_UNIT');
  });

  it('should default to general chat for informative responses', () => {
    const response = "The current temperature at the venue is 22 degrees.";
    expect(parseAIAction(response)).toBe('GENERAL_CHAT');
  });
});
