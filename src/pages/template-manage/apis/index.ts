import type * as Template from "./type"
import { request } from "@/http/axios"

// ==================== 模板文件夹 API ====================

/** 获取文件夹列表 */
export function getTemplateFolderListApi(params?: {
  parent_id?: number
}) {
  return request<Template.GetTemplateFolderListResponseData>({
    url: "template-folders",
    method: "get",
    params
  })
}

/** 创建文件夹 */
export function createTemplateFolderApi(data: Template.CreateTemplateFolderRequestData) {
  return request<Template.CreateTemplateFolderResponseData>({
    url: "template-folders",
    method: "post",
    data
  })
}

/** 更新文件夹 */
export function updateTemplateFolderApi(id: number | string, data: Template.UpdateTemplateFolderRequestData) {
  return request<Template.UpdateTemplateFolderResponseData>({
    url: `template-folders/${id}`,
    method: "put",
    data
  })
}

/** 删除文件夹 */
export function deleteTemplateFolderApi(id: number | string) {
  return request<Template.DeleteTemplateFolderResponseData>({
    url: `template-folders/${id}`,
    method: "delete"
  })
}

/** 批量删除文件夹 */
export function batchDeleteTemplateFolderApi(data: Template.BatchDeleteTemplateFolderRequestData) {
  return request<Template.BatchDeleteTemplateFolderResponseData>({
    url: "template-folders/batch-delete",
    method: "post",
    data
  })
}

// ==================== 模板 API ====================

/** 获取模板列表 */
export function getTemplateListApi(params?: {
  folder_id?: number
  page?: number
  per_page?: number
}) {
  return request<Template.GetTemplateListResponseData>({
    url: "templates",
    method: "get",
    params
  })
}

/** 创建模板 */
export function createTemplateApi(data: Template.CreateTemplateRequestData) {
  return request<Template.CreateTemplateResponseData>({
    url: "templates",
    method: "post",
    data
  })
}

/** 获取模板详情 */
export function getTemplateDetailApi(id: number | string) {
  return request<Template.GetTemplateDetailResponseData>({
    url: `templates/${id}`,
    method: "get"
  })
}

/** 更新模板 */
export function updateTemplateApi(id: number | string, data: Template.UpdateTemplateRequestData) {
  return request<Template.UpdateTemplateResponseData>({
    url: `templates/${id}`,
    method: "put",
    data
  })
}

/** 删除模板 */
export function deleteTemplateApi(id: number | string) {
  return request<Template.DeleteTemplateResponseData>({
    url: `templates/${id}`,
    method: "delete"
  })
}

/** 批量删除模板 */
export function batchDeleteTemplateApi(data: Template.BatchDeleteTemplateRequestData) {
  return request<Template.BatchDeleteTemplateResponseData>({
    url: "templates/batch-delete",
    method: "post",
    data
  })
}

/** 移动模板 */
export function moveTemplateApi(data: Template.MoveTemplateRequestData) {
  return request<Template.MoveTemplateResponseData>({
    url: "templates/move",
    method: "post",
    data
  })
}

/** 复制模板 */
export function copyTemplateApi(id: number | string) {
  return request<Template.CreateTemplateResponseData>({
    url: `templates/${id}/copy`,
    method: "post"
  })
}
