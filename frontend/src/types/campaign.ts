export interface Campaign {
  id: number
  title: string
  description: string
  category: string
  goal: number
  amountRaised: number
  deadline: string
  image: string
  creatorName: string
  creatorId: number
  status?: 'pending' | 'approved' | 'rejected'
}