/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

const TextEditor = ({
  initialText = '',
  placeholder,
  doneOnlyIfDirty,
  doneLabel = 'done',
  cancelLabel = 'x',
  onDone,
  onCancel,
  onDirty,
  error,
  disabled,
  inputStyle,
}) => {
  const [text, setText] = useState(initialText)
  const dirty = initialText !== text

  useEffect(() => {
    if (onDirty) {
      onDirty(dirty)
    }
  }, [dirty, onDirty])

  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'start',
      }}
    >
      <div>
        <input
          type="text"
          style={inputStyle}
          placeholder={placeholder}
          value={text}
          onChange={({ target }) => setText(target.value)}
          disabled={disabled}
        />
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>

      <button
        style={{ marginLeft: 12 }}
        type="button"
        onClick={() => onDone(text)}
        disabled={disabled || (doneOnlyIfDirty && !dirty)}
      >
        {doneLabel}
      </button>
      {onCancel && (
      <button style={{ marginLeft: 8 }} type="button" onClick={onCancel}>
        {cancelLabel}
      </button>
      )}
    </div>
  )
}

export default TextEditor
