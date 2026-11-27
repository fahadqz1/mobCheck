import prisma from './prisma';

async function intSetting(key: string, fallback: number) {
  const s = await prisma.platformSetting.findUnique({ where: { settingKey: key } });
  const n = s ? parseInt(s.settingValue, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const getInspectionFee = () => intSetting('inspection_fee_pkr', 1000);
export const getCommissionPercent = () => intSetting('mobcheck_commission_percentage', 20);
export const getReviewWindowHours = () => intSetting('inspection_review_window_hours', 3);
export const getSubscriptionPrice = () => intSetting('shop_subscription_price_pkr', 1200);
