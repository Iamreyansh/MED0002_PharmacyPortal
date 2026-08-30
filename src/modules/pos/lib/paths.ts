import { isPharmacyPosApiPath } from '@medmate/pos-contract';

export { isPharmacyPosApiPath };

export const POS_CART_PATH = '/api/v1/pharmacy/pos/cart';

export function cartPath(cartId: string): string {
  return `${POS_CART_PATH}/${encodeURIComponent(cartId)}`;
}

export function cartItemPath(cartId: string, itemId: string): string {
  return `${cartPath(cartId)}/items/${encodeURIComponent(itemId)}`;
}
