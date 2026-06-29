import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import InlineEditable from './InlineEditable';

type Overrides = Partial<React.ComponentProps<typeof InlineEditable>>;

function setup(overrides: Overrides = {}) {
  const onChange = jest.fn();
  const { container } = render(
    <InlineEditable enabled onChange={onChange} {...overrides}>
      <p>Hello</p>
    </InlineEditable>
  );
  const editable = container.firstChild as HTMLDivElement;
  return { onChange, editable };
}

describe('InlineEditable', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('is not contentEditable until double-clicked', () => {
    const { editable } = setup();
    expect(editable.getAttribute('contenteditable')).toBe('false');
    fireEvent.doubleClick(editable);
    expect(editable.getAttribute('contenteditable')).toBe('true');
  });

  it('does not enter edit mode when disabled (e.g. Text markdown mode)', () => {
    const { editable } = setup({ enabled: false });
    fireEvent.doubleClick(editable);
    expect(editable.getAttribute('contenteditable')).toBe('false');
    // Disabled blocks expose no textbox role.
    expect(editable.getAttribute('role')).toBeNull();
  });

  it('writes back the edited text after the debounce window', () => {
    jest.useFakeTimers();
    const { editable, onChange } = setup();
    fireEvent.doubleClick(editable);

    editable.textContent = 'Hello world';
    fireEvent.input(editable);
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onChange).toHaveBeenCalledWith('Hello world');
  });

  it('flushes immediately and exits edit mode on blur', () => {
    const { editable, onChange } = setup();
    fireEvent.doubleClick(editable);

    editable.textContent = 'Changed';
    fireEvent.blur(editable);

    expect(onChange).toHaveBeenCalledWith('Changed');
    expect(editable.getAttribute('contenteditable')).toBe('false');
  });
});
