/* eslint-disable react/prop-types */
import React from 'react'

const noOp = () => {/* ignored */}

export default function Header({
  title, onClose, 
  titleStyle = undefined, TitleComponent = 'h1', onTitleClick = noOp,
}) {
  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
      }}
    >
      <TitleComponent onClick={onTitleClick} style={titleStyle}>{title}</TitleComponent>
      {onClose && <button style={{ marginLeft: 12 }} type="button" onClick={onClose}>x</button>}
    </div>
  )
}
