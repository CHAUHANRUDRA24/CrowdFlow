import { describe, it, expect } from 'vitest';
import { chatBodySchema } from '../server/middleware/validate';

describe('Security Schema Validation', () => {
  it('should allow valid Gemini chat bodies', () => {
    const valid = {
      contents: [{ role: 'user', parts: [{ text: 'Help me' }] }],
      systemInstruction: 'Be helpful'
    };
    const result = chatBodySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject empty chat contents', () => {
    const invalid = { contents: [] };
    const result = chatBodySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject excessively long messages (Dos protection)', () => {
    const longText = 'a'.repeat(9000);
    const invalid = {
      contents: [{ role: 'user', parts: [{ text: longText }] }]
    };
    const result = chatBodySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid roles', () => {
    const invalid = {
      contents: [{ role: 'admin', parts: [{ text: 'Hack' }] }]
    };
    const result = chatBodySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
