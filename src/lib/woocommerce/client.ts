import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

// WooCommerce REST API client
class WooCommerceClient {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private client: AxiosInstance;

  constructor() {
    this.storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || '';
    this.consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || '';
    this.consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || '';

    if (!this.storeUrl || !this.consumerKey || !this.consumerSecret) {
      console.warn('WooCommerce environment variables not set');
    }

    this.client = axios.create({
      baseURL: `${this.storeUrl}/wp-json/wc/v3`,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        // Default query parameters
        per_page: 20,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`WC API: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 404) {
          console.error('WooCommerce resource not found');
        } else if (error.response?.status === 401) {
          console.error('WooCommerce authentication failed - check API keys');
        } else if (error.response?.status === 400) {
          console.error('WooCommerce bad request:', error.response?.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request with pagination support
   */
  private async get(endpoint: string, params: Record<string, any> = {}) {
    if (!this.storeUrl) {
      console.warn('WooCommerce store URL not configured, skipping request');
      return [];
    }
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * POST request
   */
  private async post(endpoint: string, data: any) {
    if (!this.storeUrl) {
      console.warn('WooCommerce store URL not configured, skipping request');
      return null;
    }
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * PUT request
   */
  private async put(endpoint: string, data: any) {
    if (!this.storeUrl) {
      console.warn('WooCommerce store URL not configured, skipping request');
      return null;
    }
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  private async del(endpoint: string) {
    if (!this.storeUrl) {
      console.warn('WooCommerce store URL not configured, skipping request');
      return null;
    }
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  // ==================== PRODUCTS ====================

  /**
   * Get all products with filters
   */
  async getProducts(params: {
    page?: number;
    per_page?: number;
    category?: number | string;
    tag?: number | string;
    search?: string;
    status?: 'publish' | 'private' | 'draft';
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
    order?: 'asc' | 'desc';
    parent?: number; // For variations
    attribute?: string;
    attribute_term?: number | string;
    after?: string; // ISO 8601 date
    before?: string;
    featured?: boolean;
  } = {}): Promise<any[]> {
    const response = await this.get('/products', params);
    return response as any[];
  }

  /**
   * Get single product by ID or SKU
   */
  async getProduct(
    idOrSku: number | string,
    params: { context?: 'view' | 'edit'; dp?: number } = {}
  ): Promise<any> {
    // If it's a number, use ID. If string, use SKU (need to search)
    if (typeof idOrSku === 'number') {
      const response = await this.get(`/products/${idOrSku}`, params);
      return response as any;
    } else {
      // Search by SKU
      const products = await this.get('/products', {
        sku: idOrSku,
        per_page: 1,
        ...params,
      });
      return products[0] as any;
    }
  }

  /**
   * Create product
   */
  async createProduct(product: {
    name: string;
    type?: 'simple' | 'grouped' | 'external' | 'variable';
    description?: string;
    short_description?: string;
    sku?: string;
    price?: string;
    regular_price?: string;
    sale_price?: string;
    date_on_sale_from?: string;
    date_on_sale_to?: string;
    on_sale?: boolean;
    status?: 'publish' | 'private' | 'draft';
    featured?: boolean;
    catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
    categories?: Array<{ id: number }>;
    tags?: Array<{ id: number }>;
    images?: Array<{ src: string; name?: string; alt?: string }>;
    attributes?: Array<{
      id?: number;
      name: string;
      position: number;
      visible: boolean;
      variation: boolean;
      options: string[];
    }>;
    default_attributes?: Array<{ id?: number; name: string; option: string }>;
    variations?: any[];
    meta_data?: Array<{ key: string; value: any }>;
  }): Promise<any> {
    const response = await this.post('/products', product);
    return response as any;
  }

  /**
   * Update product
   */
  async updateProduct(
    id: number,
    product: Partial<{
      name: string;
      description: string;
      short_description: string;
      sku: string;
      price: string;
      regular_price: string;
      sale_price: string;
      status: 'publish' | 'private' | 'draft';
      featured: boolean;
      categories: Array<{ id: number }>;
      images: Array<{ src: string; id?: number }>;
    }>
  ): Promise<any> {
    const response = await this.put(`/products/${id}`, product);
    return response as any;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number, force: boolean = false): Promise<any> {
    const response = await this.del(`/products/${id}?force=${force}`);
    return response as any;
  }

  // ==================== PRODUCT VARIATIONS ====================

  /**
   * Get product variations
   */
  async getVariations(productId: number, params: any = {}): Promise<any[]> {
    const response = await this.get(`/products/${productId}/variations`, params);
    return response as any[];
  }

  /**
   * Get single variation
   */
  async getVariation(productId: number, variationId: number): Promise<any> {
    const response = await this.get(`/products/${productId}/variations/${variationId}`);
    return response as any;
  }

  /**
   * Create product variation
   */
  async createVariation(productId: number, variation: any): Promise<any> {
    const response = await this.post(`/products/${productId}/variations`, variation);
    return response as any;
  }

  // ==================== ORDERS ====================

  /**
   * Get all orders
   */
  async getOrders(params: {
    page?: number;
    per_page?: number;
    status?: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
    customer?: number;
    date_created?: string; // ISO 8601
    date_modified?: string;
    orderby?: 'date' | 'id' | 'number' | 'total';
    order?: 'asc' | 'desc';
    product?: number;
    } = {}): Promise<any[]> {
    const response = await this.get('/orders', params);
    return response as any[];
  }

  /**
   * Get single order
   */
  async getOrder(id: number): Promise<any> {
    const response = await this.get(`/orders/${id}`);
    return response as any;
  }

  /**
   * Create order
   */
  async createOrder(order: {
    payment_method: string;
    payment_method_title: string;
    set_paid: boolean;
    billing: any;
    shipping: any;
    customer_id?: number;
    customer_note?: string;
    line_items: Array<{
      product_id: number;
      variation_id?: number;
      quantity: number;
      line_subtotal: string;
      line_total: string;
    }>;
    shipping_lines?: Array<{
      method_id: string;
      method_title: string;
      total: string;
    }>;
    fee_lines?: Array<{
      name: string;
      total: string;
    }>;
    coupon_lines?: Array<{
      code: string;
      discount: string;
    }>;
  }): Promise<any> {
    const response = await this.post('/orders', order);
    return response as any;
  }

  /**
   * Update order
   */
  async updateOrder(id: number, order: Partial<any>): Promise<any> {
    const response = await this.put(`/orders/${id}`, order);
    return response as any;
  }

  // ==================== CUSTOMERS ====================

  /**
   * Get all customers
   */
  async getCustomers(params: {
    page?: number;
    per_page?: number;
    email?: string;
    role?: string;
    orderby?: 'date' | 'id' | 'include' | 'name';
    order?: 'asc' | 'desc';
    } = {}): Promise<any[]> {
    const response = await this.get('/customers', params);
    return response as any[];
  }

  /**
   * Get single customer
   */
  async getCustomer(id: number): Promise<any> {
    const response = await this.get(`/customers/${id}`);
    return response as any;
  }

  // ==================== PRODUCT CATEGORIES ====================

  /**
   * Get all categories
   */
  async getCategories(params: {
    page?: number;
    per_page?: number;
    hide_empty?: boolean;
    parent?: number;
    search?: string;
    slug?: string;
    } = {}): Promise<any[]> {
    const response = await this.get('/products/categories', params);
    return response as any[];
  }

  /**
   * Get single category
   */
  async getCategory(idOrSlug: number | string): Promise<any> {
    if (typeof idOrSlug === 'number') {
      const response = await this.get(`/products/categories/${idOrSlug}`);
      return response as any;
    } else {
      const categories = await this.get('/products/categories', { slug: idOrSlug });
      return categories[0] as any;
    }
  }

  /**
   * Create category
   */
  async createCategory(category: {
    name: string;
    description?: string;
    parent?: number;
    image?: { src: string };
    display?: 'default' | 'products' | 'subcategories' | 'both';
    slug?: string;
  }): Promise<any> {
    const response = await this.post('/products/categories', category);
    return response as any;
  }

  // ==================== REPORTS ====================

  /**
   * Get sales report
   */
  async getSalesReport(params: {
    date_min?: string; // ISO 8601
    date_max?: string;
    group_by?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  } = {}): Promise<any> {
    const response = await this.get('/reports/sales', params);
    return response as any;
  }

  /**
   * Get top sellers report
   */
  async getTopSellersReport(params: {
    date_min?: string;
    date_max?: string;
    per_page?: number;
  } = {}): Promise<any[]> {
    const response = await this.get('/reports/sales/top_sellers', params);
    return response as any[];
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Update product stock
   */
  async updateStock(
    id: number,
    stock_quantity: number,
    options: { manage_stock?: boolean; stock_status?: 'instock' | 'outofstock' | 'onbackorder' } = {}
  ): Promise<any> {
    const response = await this.put(`/products/${id}`, {
      stock_quantity,
      ...options,
    });
    return response as any;
  }

  /**
   * Batch update stock (via products endpoint)
   */
  async batchUpdate(
    updates: Array<{ id: number; stock_quantity?: number; price?: string }>
  ): Promise<any[]> {
    // WooCommerce doesn't have batch update endpoint
    // We'll update one by one (would use wp-cli or custom endpoint for batch)
    const results = [];
    for (const update of updates) {
      const result = await this.put(`/products/${update.id}`, update);
      results.push(result);
    }
    return results;
  }

  // ==================== SYSTEM INFO ====================

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    const response = await this.get('/system_status');
    return response as any;
  }

  /**
   * Get store info
   */
  async getStoreInfo(): Promise<any> {
    const response = await this.get('/');
    return response as any;
  }

  /**
   * Get current user (for authenticated API calls)
   */
  async getCurrentUser(): Promise<any> {
    const response = await this.get('/auth/me');
    return response as any;
  }
}

export const woocommerce = new WooCommerceClient();

// Re-export types
export type WCProduct = any;
export type WCOrder = any;
export type WCCustomer = any;
export type WCCategory = any;
