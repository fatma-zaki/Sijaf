/** روابط الصور جوه التطبيق (بتوكن المستخدم) وفي صفحة العميل (عامة) */

export function quotePhotoSrc(quote: { id: string; photoCount: number }): string | null {
  return quote.photoCount > 0 ? `/api/quotes/${quote.id}/photos/${quote.photoCount - 1}` : null;
}

export function shopLogoSrc(shop: { logoVersion: string | null }): string | null {
  return shop.logoVersion ? `/api/shop/logo?v=${shop.logoVersion}` : null;
}

export function publicPhotoSrc(token: string, hasPhoto: boolean): string | null {
  return hasPhoto ? `/q/${encodeURIComponent(token)}/photo` : null;
}

export function publicLogoSrc(token: string, hasLogo: boolean): string | null {
  return hasLogo ? `/q/${encodeURIComponent(token)}/logo` : null;
}
