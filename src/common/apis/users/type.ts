export interface UserInfo {
  id: string
  username: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  roles?: string[]
  created_at?: string
  updated_at?: string
}

export type CurrentUserResponseData = ApiResponseData<UserInfo>
