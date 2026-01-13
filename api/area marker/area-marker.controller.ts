import { Request, Response } from 'express'
import { areaMarkerService } from './area-marker.service.js'
import { logger } from '../../services/logger.service.js'

export async function getAreaMarker(req: Request, res: Response): Promise<void> {
  try {
    const markerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const marker = await areaMarkerService.getById(markerId)
    res.send(marker)
  } catch (err) {
    logger.error('Failed to get area marker', err)
    res.status(400).send({ err: 'Failed to get area marker' })
  }
}

export async function getAreaMarkers(_req: Request, res: Response): Promise<void> {
  try {
    const markers = await areaMarkerService.query()
    res.send(markers)
  } catch (err) {
    logger.error('Failed to get area markers', err)
    res.status(400).send({ err: 'Failed to get area markers' })
  }
}

export async function deleteAreaMarker(req: Request, res: Response): Promise<void> {
  try {
    const markerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    await areaMarkerService.remove(markerId)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to delete area marker', err)
    res.status(400).send({ err: 'Failed to delete area marker' })
  }
}

export async function updateAreaMarker(req: Request, res: Response): Promise<void> {
  try {
    const marker = req.body
    const savedMarker = await areaMarkerService.update(marker)
    res.send(savedMarker)
  } catch (err) {
    logger.error('Failed to update area marker', err)
    res.status(400).send({ err: 'Failed to update area marker' })
  }
}

export async function addAreaMarker(req: Request, res: Response): Promise<void> {
  try {
    const marker = req.body
    const addedMarker = await areaMarkerService.add(marker)
    res.send(addedMarker)
  } catch (err) {
    logger.error('Failed to add area marker', err)
    res.status(400).send({ err: 'Failed to add area marker' })
  }
}
