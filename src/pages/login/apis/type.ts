export interface LoginRequestData {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 验证码 */
  captcha: string
  /** 验证码ID */
  captcha_id: string
}

export type CaptchaResponseData = ApiResponseData<{
  captcha_id: string
  captcha_image: string
}>

export type LoginResponseData = ApiResponseData<{ token: string }>
