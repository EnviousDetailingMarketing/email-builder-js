import React, { useState } from 'react';
import { ZodError } from 'zod';

import {
  SpaceBarOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignCenterOutlined,
  VerticalAlignTopOutlined,
} from '@mui/icons-material';
import { ToggleButton } from '@mui/material';

import ColumnsContainerPropsSchema, {
  ColumnsContainerProps,
} from '../../../../documents/blocks/ColumnsContainer/ColumnsContainerPropsSchema';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import ColumnWidthsInput from './helpers/inputs/ColumnWidthsInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import SliderInput from './helpers/inputs/SliderInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type ColumnsContainerPanelProps = {
  data: ColumnsContainerProps;
  setData: (v: ColumnsContainerProps) => void;
};
export default function ColumnsContainerPanel({ data, setData }: ColumnsContainerPanelProps) {
  const [, setErrors] = useState<ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = ColumnsContainerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const columnsCount = data.props?.columnsCount === 2 ? 2 : 3;
  // Per-column "stack on mobile" flags, parallel to the columns and defaulting to
  // stack (true). Stored as a length-3 tuple to match the block schema.
  const stackOnMobile = data.props?.stackOnMobile ?? [];
  const updateStackOnMobile = (columnIndex: number, value: boolean) => {
    const next: (boolean | null | undefined)[] = [
      stackOnMobile[0] ?? true,
      stackOnMobile[1] ?? true,
      stackOnMobile[2] ?? true,
    ];
    next[columnIndex] = value;
    updateData({ ...data, props: { ...data.props, stackOnMobile: next } });
  };

  return (
    <BaseSidebarPanel title="Columns block">
      <RadioGroupInput
        label="Number of columns"
        defaultValue={data.props?.columnsCount === 2 ? '2' : '3'}
        onChange={(v) => {
          updateData({ ...data, props: { ...data.props, columnsCount: v === '2' ? 2 : 3 } });
        }}
      >
        <ToggleButton value="2">2</ToggleButton>
        <ToggleButton value="3">3</ToggleButton>
      </RadioGroupInput>
      <ColumnWidthsInput
        defaultValue={data.props?.fixedWidths}
        onChange={(fixedWidths) => {
          updateData({ ...data, props: { ...data.props, fixedWidths } });
        }}
      />
      <SliderInput
        label="Columns gap"
        iconLabel={<SpaceBarOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={4}
        marks
        min={0}
        max={80}
        defaultValue={data.props?.columnsGap ?? 0}
        onChange={(columnsGap) => updateData({ ...data, props: { ...data.props, columnsGap } })}
      />
      <RadioGroupInput
        label="Alignment"
        defaultValue={data.props?.contentAlignment ?? 'middle'}
        onChange={(contentAlignment) => {
          updateData({ ...data, props: { ...data.props, contentAlignment } });
        }}
      >
        <ToggleButton value="top">
          <VerticalAlignTopOutlined fontSize="small" />
        </ToggleButton>
        <ToggleButton value="middle">
          <VerticalAlignCenterOutlined fontSize="small" />
        </ToggleButton>
        <ToggleButton value="bottom">
          <VerticalAlignBottomOutlined fontSize="small" />
        </ToggleButton>
      </RadioGroupInput>

      {Array.from({ length: columnsCount }).map((_, index) => (
        <BooleanInput
          key={`stack-${columnsCount}-${index}`}
          label={`Column ${index + 1}: stack on mobile`}
          defaultValue={stackOnMobile[index] ?? true}
          onChange={(value) => updateStackOnMobile(index, value)}
        />
      ))}

      <MultiStylePropertyPanel
        names={['backgroundColor', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
