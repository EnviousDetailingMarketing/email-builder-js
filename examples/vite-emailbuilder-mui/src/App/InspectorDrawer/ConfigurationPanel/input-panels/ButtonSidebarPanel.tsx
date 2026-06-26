import React, { useState } from 'react';
import { ZodError } from 'zod';

import { RoundedCornerOutlined } from '@mui/icons-material';
import { ToggleButton } from '@mui/material';
import { ButtonProps, ButtonPropsDefaults, ButtonPropsSchema } from '@usewaypoint/block-button';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColorInput, { NullableColorInput } from './helpers/inputs/ColorInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import SliderInput from './helpers/inputs/SliderInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

type ButtonSidebarPanelProps = {
  data: ButtonProps;
  setData: (v: ButtonProps) => void;
};
export default function ButtonSidebarPanel({ data, setData }: ButtonSidebarPanelProps) {
  const [, setErrors] = useState<ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = ButtonPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const text = data.props?.text ?? ButtonPropsDefaults.text;
  const url = data.props?.url ?? ButtonPropsDefaults.url;
  const fullWidth = data.props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
  const size = data.props?.size ?? ButtonPropsDefaults.size;
  const buttonStyle = data.props?.buttonStyle ?? ButtonPropsDefaults.buttonStyle;
  const buttonTextColor = data.props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
  const buttonBackgroundColor = data.props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

  // WS-07 (item 15-B): optional explicit controls. Unset == fall back to presets.
  const borderRadius = data.props?.borderRadius ?? 0;
  const borderColor = data.props?.border?.color ?? null;
  const borderWidth = data.props?.border?.width ?? 1;
  const borderStyle = data.props?.border?.style ?? 'solid';
  const hasCustomPadding = Boolean(data.props?.buttonPadding);
  const paddingVertical = data.props?.buttonPadding?.vertical ?? 12;
  const paddingHorizontal = data.props?.buttonPadding?.horizontal ?? 20;

  return (
    <BaseSidebarPanel title="Button block">
      <TextInput
        label="Text"
        defaultValue={text}
        onChange={(text) => updateData({ ...data, props: { ...data.props, text } })}
      />
      <TextInput
        label="Url"
        defaultValue={url}
        onChange={(url) => updateData({ ...data, props: { ...data.props, url } })}
      />
      <RadioGroupInput
        label="Width"
        defaultValue={fullWidth ? 'FULL_WIDTH' : 'AUTO'}
        onChange={(v) => updateData({ ...data, props: { ...data.props, fullWidth: v === 'FULL_WIDTH' } })}
      >
        <ToggleButton value="FULL_WIDTH">Full</ToggleButton>
        <ToggleButton value="AUTO">Auto</ToggleButton>
      </RadioGroupInput>
      <RadioGroupInput
        label="Size"
        defaultValue={size}
        onChange={(size) => updateData({ ...data, props: { ...data.props, size } })}
      >
        <ToggleButton value="x-small">Xs</ToggleButton>
        <ToggleButton value="small">Sm</ToggleButton>
        <ToggleButton value="medium">Md</ToggleButton>
        <ToggleButton value="large">Lg</ToggleButton>
      </RadioGroupInput>
      <RadioGroupInput
        label="Style"
        defaultValue={buttonStyle}
        onChange={(buttonStyle) => updateData({ ...data, props: { ...data.props, buttonStyle } })}
      >
        <ToggleButton value="rectangle">Rectangle</ToggleButton>
        <ToggleButton value="rounded">Rounded</ToggleButton>
        <ToggleButton value="pill">Pill</ToggleButton>
      </RadioGroupInput>
      <ColorInput
        label="Text color"
        defaultValue={buttonTextColor}
        onChange={(buttonTextColor) => updateData({ ...data, props: { ...data.props, buttonTextColor } })}
      />
      <ColorInput
        label="Button color"
        defaultValue={buttonBackgroundColor}
        onChange={(buttonBackgroundColor) => updateData({ ...data, props: { ...data.props, buttonBackgroundColor } })}
      />
      {/* WS-07 (item 15-B): custom corner radius. 0 falls back to the Style preset. */}
      <SliderInput
        label="Corner radius (override)"
        iconLabel={<RoundedCornerOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={1}
        min={0}
        max={64}
        defaultValue={borderRadius}
        onChange={(v) =>
          updateData({ ...data, props: { ...data.props, borderRadius: v === 0 ? null : v } })
        }
      />
      {/* WS-07 (item 15-B): custom inner padding (overrides the Size preset). */}
      <RadioGroupInput
        label="Inner padding"
        defaultValue={hasCustomPadding ? 'CUSTOM' : 'PRESET'}
        onChange={(mode) =>
          updateData({
            ...data,
            props: {
              ...data.props,
              buttonPadding:
                mode === 'CUSTOM' ? { vertical: paddingVertical, horizontal: paddingHorizontal } : null,
            },
          })
        }
      >
        <ToggleButton value="PRESET">Preset</ToggleButton>
        <ToggleButton value="CUSTOM">Custom</ToggleButton>
      </RadioGroupInput>
      {hasCustomPadding && (
        <>
          <SliderInput
            label="Inner padding (vertical)"
            iconLabel={<RoundedCornerOutlined sx={{ color: 'text.secondary' }} />}
            units="px"
            step={1}
            min={0}
            max={48}
            defaultValue={paddingVertical}
            onChange={(vertical) =>
              updateData({ ...data, props: { ...data.props, buttonPadding: { vertical, horizontal: paddingHorizontal } } })
            }
          />
          <SliderInput
            label="Inner padding (horizontal)"
            iconLabel={<RoundedCornerOutlined sx={{ color: 'text.secondary' }} />}
            units="px"
            step={1}
            min={0}
            max={80}
            defaultValue={paddingHorizontal}
            onChange={(horizontal) =>
              updateData({ ...data, props: { ...data.props, buttonPadding: { vertical: paddingVertical, horizontal } } })
            }
          />
        </>
      )}
      {/* WS-07 (item 15-B): optional outline border. Clearing the color removes it. */}
      <NullableColorInput
        label="Border color (outline)"
        defaultValue={borderColor}
        onChange={(color) =>
          updateData({
            ...data,
            props: {
              ...data.props,
              border: color ? { color, width: borderWidth, style: borderStyle } : null,
            },
          })
        }
      />
      {borderColor && (
        <>
          <SliderInput
            label="Border width"
            iconLabel={<RoundedCornerOutlined sx={{ color: 'text.secondary' }} />}
            units="px"
            step={1}
            min={0}
            max={12}
            defaultValue={borderWidth}
            onChange={(width) =>
              updateData({ ...data, props: { ...data.props, border: { color: borderColor, width, style: borderStyle } } })
            }
          />
          <RadioGroupInput
            label="Border style"
            defaultValue={borderStyle}
            onChange={(style) =>
              updateData({
                ...data,
                props: {
                  ...data.props,
                  border: { color: borderColor, width: borderWidth, style: style as 'solid' | 'dashed' | 'dotted' | 'none' },
                },
              })
            }
          >
            <ToggleButton value="solid">Solid</ToggleButton>
            <ToggleButton value="dashed">Dashed</ToggleButton>
            <ToggleButton value="dotted">Dotted</ToggleButton>
          </RadioGroupInput>
        </>
      )}
      <MultiStylePropertyPanel
        names={['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
