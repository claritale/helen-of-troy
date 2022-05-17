/* eslint-disable react/prop-types */
import React from 'react'

export default function MyOffersSellingDialog({ info, error, onSelect }) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding:      12,
        margin:       20,
        background:   'azure',
      }}
    >
      <h3 style={{ color: 'gray' }}>{`Step: ${info.step}`}</h3>

      <h1 style={{ marginTop: 12, whiteSpace: 'break-spaces' }}>{info.title}</h1>

      {info.subtitle && <h2 style={{ marginTop: 12, whiteSpace: 'break-spaces' }}>{info.subtitle}</h2>}

      {info.opts.map((opt) => (
        <div key={opt.opt}>
          <button
            type="button"
            style={{ marginTop: 12 }}
            disabled={opt.disabled}
            onClick={() => onSelect(opt.opt)}
          >
            {opt.caption}
          </button>
        </div>
      ))}

      {error && <h3 style={{ marginTop: 12, color: 'red', whiteSpace: 'break-spaces' }}>{error}</h3>}
    </div>
  )
}
