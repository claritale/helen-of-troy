import React from 'react'

const Checkbox = ({
  // eslint-disable-next-line react/prop-types
  id, label, isSelected, onCheckboxChange, disabled, maxWidth,
}) => (
  // <div className={'form-check'}>
  <label
    htmlFor={`checkbox${id}`}
    style={{
      display: 'flex',
      maxWidth,
    }}
    disabled={disabled}
  >
    <input
      id={`checkbox${id}`}
      name={`checkbox${id}`}
      type="checkbox"
      checked={isSelected}
      onChange={() => onCheckboxChange(id)}
      className="form-check-input"
      disabled={disabled}
    />
    <span
      style={{
        marginLeft:   8,
        display:      'inline-block',
        overflow:     'hidden',
        whiteSpace:   'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
  </label>
  // </div>
)

export default Checkbox
