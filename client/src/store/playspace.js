import { TILE_WIDTH, TILE_HEIGHT } from '../constants'
import Tile from '../models/Tile'
import Train from '../models/Train'
import { saveTileData, loadTileData } from '../services/persistence'

export const UPDATE_TRAIN = "UPDATE_TRAIN"
export const TRAIN_TRAVEL = "TRAIN_TRAVEL"
export const INSERT_TRAIN = "INSERT_TRAIN"
export const DELETE_TRAIN = "DELETE_TRAIN"
export const ADD_CAR_TO_TRAIN = "ADD_CAR_TO_TRAIN"
export const REMOVE_CAR_FROM_TRAIN = "REMOVE_CAR_FROM_TRAIN"

export const UPDATE_TILE = "UPDATE_TILE"
export const INSERT_TILE = "INSERT_TILE"
export const DELETE_TILE = "DELETE_TILE"
export const LOAD_TILES = "LOAD_TILES"
export const TOGGLE_SEGMENT = "TOGGLE_SEGMENT"



const initialState = {
  trains: {},
  tiles: {}
}

// ACTION CREATORS
// ====================

export const updateTrain = (train) => ({
  type: UPDATE_TRAIN,
  payload: train
})

export const trainTravel = (train, steps) => ({
  type: TRAIN_TRAVEL,
  payload: { train, steps }
})

export const stopTrain = (trainId) => ({
  type: UPDATE_TRAIN,
  payload: { id: trainId, speed: 0 }
})

export const addCarToTrain = (trainId) => ({
  type: ADD_CAR_TO_TRAIN,
  payload: trainId
})

export const removeCarFromTrain = (trainId) => ({
  type: REMOVE_CAR_FROM_TRAIN,
  payload: trainId
})

export const deleteTrain = (trainId) => ({
  type: DELETE_TRAIN,
  payload: trainId
})

export const addTrainToTile = (tile) => {
  return {
    type: INSERT_TRAIN,
    payload: {
      tilePosition: tile.position,
      entryPoint: tile.from,
      step: 10,
    }
  }
}

export const persistTiles = () => async (dispatch, getState) => {
  const tiles = Object.values(getState().playspace.tiles)
  await saveTileData(tiles)
}

export const persistTileAction = (tile, actionCreator) => async (dispatch) => {
  dispatch(actionCreator(tile))
  return dispatch(persistTiles())
}

export const fetchTiles = () => async (dispatch) => {
  const tiles = (await loadTileData()) || []
  dispatch(loadTiles(tiles))
}

export const updateTile = (tile) => ({
  type: UPDATE_TILE,
  payload: tile
})

export const rotateTile = (tile) => ({
  type: UPDATE_TILE,
  payload: {
    position: tile.position,
    rotation: (tile.rotation + 90) % 360
  }
})

export const toggleTileSegment = (tile) => ({
  type: UPDATE_TILE,
  payload: {
    position: tile.position,
    selectedSegment: tile.selectedSegment < tile.segments.length - 1
                   ? tile.selectedSegment + 1
                   : 0
  }
})

export const insertTile = (tile) => ({
  type: INSERT_TILE,
  payload: tile
})

export const deleteTile = (tile) => ({
  type: DELETE_TILE,
  payload: tile
})

export const loadTiles = (tiles) => ({
  type: LOAD_TILES,
  payload: tiles
})


const actionHandlers = {
  [INSERT_TRAIN]: (state, { payload }) => {
    const train = new Train(payload)
    const trains = { ...state.trains }
    trains[train.id] = train
    return { ...state, trains }
  },
  [UPDATE_TRAIN]: (state, {payload}) => {
    const existingTrain = selectTrainById(state, payload.id)
    const updatedTrain = new Train({ ...existingTrain, ...payload })
    return { ...state, trains: {
      ...state.trains,
      [payload.id]: updatedTrain
    } }
  },
  [TRAIN_TRAVEL]: (state, {payload}) => {
    const {train, steps} = payload
    const {
      tilePosition,
      step,
      entryPoint,
      speed,
    } = getDestinationTile(train, steps, state.tiles)


    return {...state, trains: {
      ...state.trains,
      [train.id]: new Train({
        ...train,
        step,
        tilePosition,
        entryPoint,
        speed
      })
    }}

  },

  [ADD_CAR_TO_TRAIN]: (state, { payload: trainId }) => {
    const train = state.trains[trainId]
    train.cars += 1
    return {...state, trains: {
      ...state.trains,
      [trainId]: new Train(train)
    }}
  },

  [REMOVE_CAR_FROM_TRAIN]: (state, { payload: trainId }) => {
    const train = state.trains[trainId]
    train.cars = (train.cars <= 0) ? 0 : train.cars - 1
    return {...state, trains: {
      ...state.trains,
      [trainId]: new Train(train)
    }}
  },

  [DELETE_TRAIN]: (state, { payload }) => {
    const trainId = payload
    const trains = {...state.trains}
    delete trains[trainId]
    return {...state, trains}
  },

  [UPDATE_TILE]: (state, { payload }) => {
    const existingTile = selectTileByPosition(state, payload.position)
    const updatedTile = new Tile({...existingTile, ...payload })
    const index = updatedTile.position.toString()
    const tiles = { ...state.tiles, [index]: updatedTile}
    return { ...state, tiles }
  },

  [INSERT_TILE]: (state, { payload }) => {
    const tile = new Tile(payload)
    const index = tile.position.toString()
    const tiles = { ...state.tiles, [index]: tile }
    return {...state, tiles }
  },

  [DELETE_TILE]: (state, { payload }) => {
    const tile = payload
    const index = tile.position.toString()
    const tiles = {...state.tiles}
    delete tiles[index]
    return { ...state, tiles }
  },

  [LOAD_TILES]: (state, { payload }) => {
    const tiles = payload.reduce((map, tile) => {
      const index = tile.position.toString()
      map[index] = new Tile(tile)
      return map
    }, {})
    return { ...state, tiles }
  }

}

export default function reducer(state=initialState, action) {
  return actionHandlers.hasOwnProperty(action.type)
       ? actionHandlers[action.type](state, action)
       : state
}


// SELECTORS
// ===================

export function selectTrainById(state, id) {
  return state.trains[id]
}

export function selectAllTrains(state) {
  return Object.values(state.trains)
}

export const selectTileByPosition = (state, position) => {
  return state.tiles[position.toString()]
}

export const selectTileByCoordinates = (state, [x, y]) => {
  const position = [
    Math.floor(x / TILE_WIDTH),
    Math.floor(y / TILE_HEIGHT)
  ]
  return selectTileByPosition(state, position)
}

export const selectAllTiles = (state) => {
  return Object.values(state.tiles)
}


export function getDestinationTile(train, steps, tiles) {
  const { step, entryPoint, tilePosition, speed } = train
  const tile = tiles[tilePosition.toString()]
  const destStep = step + steps

  if (destStep >=0 && destStep < tile.totalSteps) {
    return { step: destStep, entryPoint, tilePosition, speed}
  }


  const forward = (destStep >= 0)
  const nextTilePosition = (forward)
                         ? tile.nextTilePosition(entryPoint)
                         : tile.previousTilePosition(entryPoint)
  const nextTile = tiles[nextTilePosition.toString()]
  if (!nextTile) {
    return {
      step: (forward) ? tile.totalSteps : 0,
      speed: 0,
      entryPoint,
      tilePosition,
    }
  }

  const borderStep = (forward) ? tile.totalSteps + 1 : -1
  const { point: borderCoords } = tile.travelFunction(borderStep, entryPoint)
  const nextEntryPoint = nextTile.getReferencePoint(borderCoords, speed)
  if (!nextEntryPoint) {
    return {
      step: (forward) ? tile.totalSteps : 0,
      speed: 0,
      entryPoint,
      tilePosition,
    }
  }


  const trainParams = {
    step: 0,
    entryPoint: nextEntryPoint,
    tilePosition: nextTilePosition,
    speed
  }
  const newDestStep = (forward)
                    ? destStep - tile.totalSteps
                    : nextTile.totalSteps + destStep // destStep is negative here
  return getDestinationTile(trainParams, newDestStep, tiles)
}
