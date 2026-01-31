import type * as Product from "./type"
import { request } from "@/http/axios"

/** 获取产品列表 */
export function getProductListApi(params?: {
  page?: number
  per_page?: number
  status?: number
  name?: string
}) {
  return request<Product.GetProductListResponseData>({
    url: "products",
    method: "get",
    params
  })
}

/** 获取产品详情 */
export function getProductDetailApi(id: string) {
  return request<Product.GetProductDetailResponseData>({
    url: `products/${id}`,
    method: "get"
  })
}

/** 获取所有启用的产品 */
export function getAllProductsApi() {
  return request<Product.GetAllProductsResponseData>({
    url: "products/all",
    method: "get"
  })
}

/** 创建产品 */
export function createProductApi(data: Product.CreateProductRequestData) {
  return request<Product.CreateProductResponseData>({
    url: "products",
    method: "post",
    data
  })
}

/** 更新产品 */
export function updateProductApi(id: string, data: Product.UpdateProductRequestData) {
  return request<Product.UpdateProductResponseData>({
    url: `products/${id}`,
    method: "put",
    data
  })
}

/** 删除产品 */
export function deleteProductApi(id: string) {
  return request<Product.DeleteProductResponseData>({
    url: `products/${id}`,
    method: "delete"
  })
}

/** 批量删除产品 */
export function batchDeleteProductApi(data: Product.BatchDeleteProductRequestData) {
  return request<Product.BatchDeleteProductResponseData>({
    url: "products/batch-delete",
    method: "post",
    data
  })
}
