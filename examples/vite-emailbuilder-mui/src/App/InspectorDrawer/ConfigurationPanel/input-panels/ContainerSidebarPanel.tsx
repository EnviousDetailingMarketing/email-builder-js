import React, { useState } from 'react';
import type { ZodError } from 'zod';

import { LineWeightOutlined } from '@mui/icons-material';
import { ToggleButton } from '@mui/material';

import ContainerPropsSchema, { ContainerProps } from '../../../../documents/blocks/Container/ContainerPropsSchema';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import SliderInput from './helpers/inputs/SliderInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type ContainerSidebarPanelProps = {
  data: ContainerProps;
  setData: (v: ContainerProps) => void;
};

export default function ContainerSidebarPanel({ data, setData }: ContainerSidebarPanelProps) {
  const [, setErrors] = useState<ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = ContainerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  // WS-07 (item 15-C): optional border width/style. Unset == the legacy
  // `1px solid` behavior, so existing documents are unaffected.
  const borderWidth = data.style?.borderWidth ?? 1;
  const borderStyle = data.style?.borderStyle ?? 'solid';

  return (
    <BaseSidebarPanel title="Container block">
      <MultiStylePropertyPanel
        names={['backgroundColor', 'borderColor', 'borderRadius', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
      <SliderInput
        label="Border width"
        iconLabel={<LineWeightOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={1}
        min={0}
        max={12}
        defaultValue={borderWidth}
        onChange={(v) => updateData({ ...data, style: { ...data.style, borderWidth: v } })}
      />
      <RadioGroupInput
        label="Border style"
        defaultValue={borderStyle}
        onChange={(v) =>
          updateData({
            ...data,
            style: { ...data.style, borderStyle: v as 'solid' | 'dashed' | 'dotted' | 'none' },
          })
        }
      >
        <ToggleButton value="solid">Solid</ToggleButton>
        <ToggleButton value="dashed">Dashed</ToggleButton>
        <ToggleButton value="dotted">Dotted</ToggleButton>
        <ToggleButton value="none">None</ToggleButton>
      </RadioGroupInput>
    </BaseSidebarPanel>
  );
}
