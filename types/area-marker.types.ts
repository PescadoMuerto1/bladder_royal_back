export interface AreaMarker {
  _id?: string
  id?: string
  position: {
    lat: number
    lng: number
    latitude?: number
    longitude?: number
  }
  title?: string
  description?: string
  color?: number
  icon?: string
  radius?: number
  createdAt?: Date
  createdBy?: string
}

export interface AreaMarkerToAdd {
  position: {
    lat: number
    lng: number
    latitude?: number
    longitude?: number
  }
  title?: string
  description?: string
  color?: number
  icon?: string
  radius?: number
  createdBy?: string
}

export interface AreaMarkerToUpdate {
  _id: string
  position?: {
    lat: number
    lng: number
    latitude?: number
    longitude?: number
  }
  title?: string
  description?: string
  color?: number
  icon?: string
  radius?: number
}
