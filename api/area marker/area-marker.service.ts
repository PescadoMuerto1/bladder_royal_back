import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import mongoDB from 'mongodb'
const { ObjectId } = mongoDB
import { AreaMarker, AreaMarkerToAdd, AreaMarkerToUpdate } from '../../types/area-marker.types.js'

export const areaMarkerService = {
  add,
  getById,
  update,
  remove,
  query
}

async function query(): Promise<AreaMarker[]> {
  try {
    const collection = await dbService.getCollection('areaMarker')
    const markers = await collection.find().toArray()
    return markers.map(marker => {
      const markerObj = marker as any
      // _id from MongoDB is already an ObjectId instance, use it directly
      markerObj.createdAt = (markerObj._id instanceof ObjectId 
        ? markerObj._id 
        : new ObjectId(markerObj._id)).getTimestamp()
      const id = markerObj._id.toString()
      // Normalize position to include both lat/lng and latitude/longitude
      if (markerObj.position) {
        markerObj.position.latitude = markerObj.position.lat
        markerObj.position.longitude = markerObj.position.lng
      }
      return {
        ...markerObj,
        _id: id,
        id: id
      } as AreaMarker
    })
  } catch (err) {
    logger.error('cannot find area markers', err)
    throw err
  }
}

async function getById(markerId: string): Promise<AreaMarker | null> {
  try {
    const collection = await dbService.getCollection('areaMarker')
    const marker = await collection.findOne({ _id: new ObjectId(markerId) })
    if (!marker) return null
    const markerObj = marker as any
    const id = markerObj._id.toString()
    // Normalize position to include both lat/lng and latitude/longitude
    if (markerObj.position) {
      markerObj.position.latitude = markerObj.position.lat
      markerObj.position.longitude = markerObj.position.lng
    }
    return {
      ...markerObj,
      _id: id,
      id: id
    } as AreaMarker
  } catch (err) {
    logger.error(`while finding area marker by id: ${markerId}`, err)
    throw err
  }
}

async function remove(markerId: string): Promise<void> {
  try {
    const collection = await dbService.getCollection('areaMarker')
    await collection.deleteOne({ _id: new ObjectId(markerId) })
  } catch (err) {
    logger.error(`cannot remove area marker ${markerId}`, err)
    throw err
  }
}

async function update(marker: AreaMarkerToUpdate): Promise<AreaMarker> {
  try {
    const markerToSave: Partial<AreaMarker> = {}
    
    if (marker.position) {
      markerToSave.position = {
        lat: marker.position.lat,
        lng: marker.position.lng,
        latitude: marker.position.lat,
        longitude: marker.position.lng
      }
    }
    if (marker.title !== undefined) markerToSave.title = marker.title
    if (marker.description !== undefined) markerToSave.description = marker.description
    if (marker.color !== undefined) markerToSave.color = marker.color
    if (marker.icon !== undefined) markerToSave.icon = marker.icon
    if (marker.radius !== undefined) markerToSave.radius = marker.radius
    
    const collection = await dbService.getCollection('areaMarker')
    await collection.updateOne(
      { _id: new ObjectId(marker._id) }, 
      { $set: markerToSave }
    )
    
    // Return the updated marker
    const updatedMarker = await getById(marker._id)
    if (!updatedMarker) {
      throw new Error('Marker not found after update')
    }
    return updatedMarker
  } catch (err) {
    logger.error(`cannot update area marker ${marker._id}`, err)
    throw err
  }
}

async function add(marker: AreaMarkerToAdd): Promise<AreaMarker> {
  try {
    // Normalize position to include both lat/lng and latitude/longitude
    const position = {
      lat: marker.position.lat,
      lng: marker.position.lng,
      latitude: marker.position.lat,
      longitude: marker.position.lng
    }
    
    const markerToAdd: Partial<AreaMarker> = {
      position,
      title: marker.title,
      description: marker.description,
      color: marker.color,
      icon: marker.icon,
      radius: marker.radius || 500.0,
      createdBy: marker.createdBy
    }
    const collection = await dbService.getCollection('areaMarker')
    const result = await collection.insertOne(markerToAdd as any)
    const id = result.insertedId.toString()
    return { 
      ...markerToAdd, 
      _id: id,
      id: id
    } as AreaMarker
  } catch (err) {
    logger.error('cannot add area marker', err)
    throw err
  }
}
