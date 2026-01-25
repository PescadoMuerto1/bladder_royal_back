export interface FriendRequest {
  _id?: string
  id?: string
  fromUserId: string // User who sent the request
  toUserId: string   // User who received the request
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
}

export interface FriendRequestToAdd {
  fromUserId: string
  toUserId: string
}

export interface FriendRequestToUpdate {
  _id: string
  status: 'accepted' | 'declined' | 'cancelled'
}
