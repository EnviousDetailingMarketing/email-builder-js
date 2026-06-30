import React, { useState } from 'react';
import { HexAlphaColorPicker, HexColorInput } from 'react-colorful';

import { Box, Button, Stack, SxProps } from '@mui/material';

import Swatch from './Swatch';

// react-colorful parses 3/4/6/8-digit hex natively but not `rgba()` or
// `transparent`. The widened COLOR_SCHEMA accepts those, and a value authored
// via JSON/CRM may arrive in any of them, so normalize to a hex string the
// picker can display. Best-effort: unknown/named colors fall back to black.
function toPickerHex(value: string): string {
  const v = value.trim();
  if (v === '') {
    return '#000000';
  }
  if (v.toLowerCase() === 'transparent') {
    return '#00000000';
  }
  if (v.startsWith('#')) {
    return v;
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const toHex2 = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
      const channel = (c: string) => {
        const n = c.endsWith('%') ? Math.round((parseFloat(c) / 100) * 255) : parseInt(c, 10);
        return Number.isFinite(n) ? n : 0;
      };
      const [r, g, b, a] = parts;
      let alpha = '';
      if (a !== undefined) {
        const av = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
        const ab = Math.round((Number.isFinite(av) ? av : 1) * 255);
        if (ab < 255) {
          alpha = toHex2(ab);
        }
      }
      return `#${toHex2(channel(r))}${toHex2(channel(g))}${toHex2(channel(b))}${alpha}`;
    }
  }
  return '#000000';
}

const DEFAULT_PRESET_COLORS = [
  '#E11D48',
  '#DB2777',
  '#C026D3',
  '#9333EA',
  '#7C3AED',
  '#4F46E5',
  '#2563EB',
  '#0284C7',
  '#0891B2',
  '#0D9488',
  '#059669',
  '#16A34A',
  '#65A30D',
  '#CA8A04',
  '#D97706',
  '#EA580C',
  '#DC2626',
  '#FFFFFF',
  '#FAFAFA',
  '#F5F5F5',
  '#E5E5E5',
  '#D4D4D4',
  '#A3A3A3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#171717',
  '#0A0A0A',
  '#000000',
];

const SX: SxProps = {
  p: 1,
  '.react-colorful__pointer ': {
    width: 16,
    height: 16,
  },
  '.react-colorful__saturation': {
    mb: 1,
    borderRadius: '4px',
  },
  '.react-colorful__last-control': {
    borderRadius: '4px',
  },
  '.react-colorful__hue-pointer': {
    width: '4px',
    borderRadius: '4px',
    height: 24,
    cursor: 'col-resize',
  },
  '.react-colorful__saturation-pointer': {
    cursor: 'all-scroll',
  },
  input: {
    padding: 1,
    border: '1px solid',
    borderColor: 'grey.300',
    borderRadius: '4px',
    width: '100%',
  },
};

type Props = {
  value: string;
  onChange: (v: string) => void;
};
// Alpha-capable picker (CR-6): `HexAlphaColorPicker` adds an opacity slider and
// emits `#RRGGBB` when fully opaque or `#RRGGBBAA` when translucent — both
// accepted by the widened COLOR_SCHEMA. The text field takes 8-digit hex too.
// Outlook (Word engine) ignores CSS alpha, so translucent colors fall back to
// opaque there; that caveat is documented on COLOR_SCHEMA in block-kit.
export default function Picker({ value, onChange }: Props) {
  const [internalValue, setInternalValue] = useState(() => toPickerHex(value));
  const handleChange = (v: string) => {
    setInternalValue(v);
    if (/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) {
      onChange(v);
    }
  };
  // The alpha slider already reaches full transparency, but the `transparent`
  // keyword is the clearest, most portable way to author it (and what authors
  // expect). Emit the keyword directly — it's accepted by COLOR_SCHEMA and
  // round-trips through `toPickerHex` to a fully-transparent swatch.
  const handleTransparent = () => {
    setInternalValue('#00000000');
    onChange('transparent');
  };

  return (
    <Stack spacing={1} sx={SX}>
      <HexAlphaColorPicker color={toPickerHex(value)} onChange={handleChange} />
      <Swatch paletteColors={DEFAULT_PRESET_COLORS} value={value} onChange={handleChange} />
      <Box pt={1}>
        <HexColorInput prefixed alpha color={internalValue} onChange={handleChange} />
      </Box>
      <Button size="small" variant="outlined" onClick={handleTransparent}>
        Transparent
      </Button>
    </Stack>
  );
}
