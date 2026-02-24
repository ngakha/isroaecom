export function isSaleActive(product) {
  if (!product.sale_price || parseFloat(product.sale_price) <= 0) return false;
  if (parseFloat(product.sale_price) >= parseFloat(product.price)) return false;
  if (product.sale_end_date && new Date(product.sale_end_date) <= new Date()) return false;
  return true;
}
