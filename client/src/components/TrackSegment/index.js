import React, { useState } from 'react'
import Straight from './Straight'
import Curve from './Curve'
import { TILE_WIDTH, TILE_HEIGHT } from '../../constants'

const noop = () => {}

export default ({ id, type, rotation, position, updateTile=noop }) => {
  const [ x, y ] = position
  const [ state, setState ] = useState({
    hovering: false
  })

  const Track = (type === 'STRAIGHT') ? Straight
              : (type === "CURVE")    ? Curve
              : () => <></>

  return (
    <svg
      x={x*TILE_WIDTH}
      y={y*TILE_HEIGHT}
      onMouseEnter={() => setState({ hovering: true })}
      onMouseLeave={() => setState({ hovering: false })}
    >
      <Track rotation={rotation} />

      {state.hovering && (
        <rect
          x={TILE_WIDTH/2 - 10}
          y={TILE_HEIGHT/2 - 10}
          width={20}
          height={20}
          onClick={() => updateTile({ id, rotation: (rotation+90) % 360})}
        />
      )}
    </svg>
  )
}

export { default as Straight } from "./Straight"
export { default as Curve } from "./Curve"
