import express, { Router } from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { 
  getAreaMarker, 
  getAreaMarkers, 
  deleteAreaMarker, 
  updateAreaMarker,
  addAreaMarker 
} from './area-marker.controller.js'

const router: Router = express.Router()

router.get('/', getAreaMarkers)
router.get('/:id', getAreaMarker)
router.post('/', requireAuth, addAreaMarker)
router.put('/:id', requireAuth, updateAreaMarker)
router.delete('/:id', requireAuth, deleteAreaMarker)

export const areaMarkerRoutes = router
