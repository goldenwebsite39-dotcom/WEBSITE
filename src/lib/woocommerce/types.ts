// WooCommerce TypeScript types (simplified)
// Full reference: https://woocommerce.github.io/woocommerce-rest-api-docs/

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'publish' | 'private' | 'draft';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: Array<{
    id: string;
    name: string;
    file: string;
    file_length: number;
    remaining?: number;
  }>;
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class_id: number;
  shipping_class: string;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: Array<{ id: number; name: string; option: string }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<{ key: string; value: any }>;
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
  };
}

export interface WCOrder {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  date_created: string;
  date_modified: string;
  date_completed: string | null;
  date_paid: string | null;
  currency: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  cart_hash: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: any[];
    meta_data: any[];
    sku: string;
    price: number;
  }>;
  shipping_lines: Array<{
    id: number;
    method_id: string;
    method_title: string;
    total: string;
  }>;
  fee_lines: Array<{
    id: number;
    name: string;
    total: string;
  }>;
  coupon_lines: Array<{
    id: number;
    code: string;
    discount: string;
  }>;
  refunds: any[];
  set_paid: boolean;
  set_currency: boolean;
  set_customer_id: boolean;
  set_billing: boolean;
  set_shipping: boolean;
  set_payment_method: boolean;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  total: string;
  total_tax: string;
  total_line_items_quantity: number;
  total_shipping: string;
  total_shipping_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  subtotal: string;
  subtotal_tax: string;
  tax_lines: any[];
  meta_data: any[];
  pament: boolean;
  user_id: number;
  user: any;
}

export interface WCCustomer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  is_paying_customer: boolean;
  avatar_url: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: { src: string; name: string; alt: string } | null;
  menu_order: number;
  count: number;
}

export interface WCReportSales {
  interval: string;
  data: Array<{
    date: string;
    orders: number;
    amount: string;
    customers: number;
  }>;
  totals: {
    orders: number;
    amount: string;
    customers: number;
    coupons: number;
  };
}

// Price tracking types (custom for our app)
export interface CompetitorPrice {
  id: string;
  variant_id: number;
  variant_sku: string;
  competitor_name: string;
  competitor_url: string;
  price: number;
  currency: string;
  in_stock: boolean;
  last_checked: string;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  variant_id: number;
  variant_sku: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  reason: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: number;
  variant_id: number;
  target_price: number;
  is_active: boolean;
  last_notified: string | null;
  created_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: number;
  type: 'email' | 'whatsapp' | 'in_app';
  channel: 'price_drop' | 'low_stock' | 'order_update' | 'back_in_stock';
  title: string;
  body: string;
  data: any;
  status: 'pending' | 'sent' | 'failed' | 'read';
  scheduled_for: string;
  sent_at: string | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
}
