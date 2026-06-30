import React, { useState } from 'react';

import { RoundedCornerOutlined } from '@mui/icons-material';
import { InputLabel, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';

import RawSliderInput from './raw/RawSliderInput';

type TPerCornerValue = {
  topLeft?: number | null;
  topRight?: number | null;
  bottomRight?: number | null;
  bottomLeft?: number | null;
};
// A bare number means "all corners"; an object means "individual corners".
type TValue = number | TPerCornerValue | null;

type Props = {
  label: string;
  defaultValue: TValue;
  onChange: (value: TValue) => void;
};

const SLIDER_PROPS = { units: 'px', step: 4, min: 0, max: 48, marks: true } as const;

// Collapse a per-corner object to a single "all corners" number, preserving the
// largest radius so toggling back to "All" doesn't silently flatten a rounded
// look to 0.
function toAll(value: TValue): number {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return 0;
  }
  return Math.max(value.topLeft ?? 0, value.topRight ?? 0, value.bottomRight ?? 0, value.bottomLeft ?? 0);
}

// Expand an "all corners" value to a per-corner object so individual editing
// starts from the current visible state.
function toPerCorner(value: TValue): Required<TPerCornerValue> {
  if (value && typeof value === 'object') {
    return {
      topLeft: value.topLeft ?? 0,
      topRight: value.topRight ?? 0,
      bottomRight: value.bottomRight ?? 0,
      bottomLeft: value.bottomLeft ?? 0,
    };
  }
  const n = typeof value === 'number' ? value : 0;
  return { topLeft: n, topRight: n, bottomRight: n, bottomLeft: n };
}

const CORNERS: Array<{ key: keyof TPerCornerValue; rotate: number }> = [
  { key: 'topLeft', rotate: 0 },
  { key: 'topRight', rotate: 90 },
  { key: 'bottomRight', rotate: 180 },
  { key: 'bottomLeft', rotate: 270 },
];

export default function BorderRadiusInput({ label, defaultValue, onChange }: Props) {
  const [mode, setMode] = useState<'all' | 'individual'>(
    defaultValue && typeof defaultValue === 'object' ? 'individual' : 'all'
  );
  const [allValue, setAllValue] = useState(() => toAll(defaultValue));
  const [perCorner, setPerCorner] = useState<Required<TPerCornerValue>>(() => toPerCorner(defaultValue));

  const handleMode = (next: 'all' | 'individual') => {
    setMode(next);
    if (next === 'all') {
      const collapsed = toAll(perCorner);
      setAllValue(collapsed);
      onChange(collapsed);
    } else {
      const expanded = toPerCorner(allValue);
      setPerCorner(expanded);
      onChange(expanded);
    }
  };

  const handleAll = (v: number) => {
    setAllValue(v);
    onChange(v);
  };

  const handleCorner = (key: keyof TPerCornerValue, v: number) => {
    const next = { ...perCorner, [key]: v };
    setPerCorner(next);
    onChange(next);
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      <InputLabel shrink>{label}</InputLabel>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        onChange={(_, v: unknown) => {
          if (v === 'all' || v === 'individual') {
            handleMode(v);
          }
        }}
      >
        <ToggleButton value="all">All corners</ToggleButton>
        <ToggleButton value="individual">Individual</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'all' ? (
        <RawSliderInput {...SLIDER_PROPS} iconLabel={<RoundedCornerOutlined />} value={allValue} setValue={handleAll} />
      ) : (
        <Stack spacing={2} width="100%" pt={1}>
          {CORNERS.map(({ key, rotate }) => (
            <RawSliderInput
              key={key}
              {...SLIDER_PROPS}
              iconLabel={<RoundedCornerOutlined sx={{ fontSize: 16, transform: `rotate(${rotate}deg)` }} />}
              value={perCorner[key] ?? 0}
              setValue={(v) => handleCorner(key, v)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
