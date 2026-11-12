
export interface Campaign {
  id: number
  title: string
  description: string
  category: string
  goal: number
  amount_raised: number
  deadline: string
  image: string | null
  creator_id: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: Date
  updated_at: Date
}
