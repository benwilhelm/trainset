import { TILE_WIDTH, TILE_HEIGHT } from './constants'

export const tilePositionFromCoordinates = ([x, y]) => {
  return [
    Math.floor(x / TILE_WIDTH),
    Math.floor(y / TILE_HEIGHT)
  ]
}

export const reflectOver = (val, reflector) => {
  const diff = reflector - val
  return val + (2*diff)
}


export const cartesianFromPolar = ([r, theta]) => ([
  r * Math.cos(theta),
  r * Math.sin(theta)
])

export const degreesFromRadians = (theta) => theta * (180 / Math.PI)

export const pageCoordsToSvgCoords = (pageCoords, svg) => {
  const [ pageX, pageY ] = pageCoords
  const pt = svg.createSVGPoint()
  pt.x = pageX
  pt.y = pageY
  const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse())
  return [ x, y ]
}
