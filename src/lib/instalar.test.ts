import { describe, expect, it } from 'vitest';
import { sistema } from '../components/InstalarApp';

describe('aviso de colocar na tela do celular', () => {
  it('reconhece iPhone, iPad, Android e computador', () => {
    expect(sistema('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe('iphone');
    expect(sistema('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('iphone'); // iPad novo se diz Mac
    expect(sistema('Mozilla/5.0 (Linux; Android 14; SM-A146M)', 5)).toBe('android');
    expect(sistema('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe('outro');
    expect(sistema('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0)).toBe('outro');
  });
});
