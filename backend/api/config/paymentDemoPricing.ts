const toLower = (value: unknown): string => String(value || '').trim().toLowerCase();

const parseBooleanFlag = (value: unknown): boolean => ['1', 'true', 'yes', 'on'].includes(toLower(value));

const toSafeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const normalizePositiveAmount = (value: unknown): number | null => {
  const parsed = toSafeNumber(value);
  if (parsed == null || parsed <= 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
};

interface ParsedExpiresAt {
  value: string | null;
  isSet: boolean;
  isValid: boolean;
}

const parseExpiresAt = (value: unknown): ParsedExpiresAt => {
  const raw = String(value || '').trim();
  if (!raw) {
    return {
      value: null,
      isSet: false,
      isValid: true,
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return {
      value: raw,
      isSet: true,
      isValid: false,
    };
  }

  return {
    value: parsed.toISOString(),
    isSet: true,
    isValid: true,
  };
};

const formatPhpAmount = (amount: unknown): string => Number(amount || 0).toFixed(2);

interface DemoPricingConfig {
  enabledFlag: boolean;
  demoAmountPhp: number | null;
  demoAmountRaw: string | null;
  expiresAt: ParsedExpiresAt;
}

const getDemoPricingConfig = (): DemoPricingConfig => {
  const enabledFlag = parseBooleanFlag(process.env.PAYMENT_DEMO_PRICING_ENABLED);
  const parsedAmount = normalizePositiveAmount(
    process.env.PAYMENT_DEMO_AMOUNT_PHP == null
      ? '1.00'
      : process.env.PAYMENT_DEMO_AMOUNT_PHP
  );
  const expiresAt = parseExpiresAt(process.env.PAYMENT_DEMO_PRICING_EXPIRES_AT);

  return {
    enabledFlag,
    demoAmountPhp: parsedAmount,
    demoAmountRaw: String(process.env.PAYMENT_DEMO_AMOUNT_PHP || '').trim() || null,
    expiresAt,
  };
};

interface DemoPricingStatus {
  realAmount: number;
  providerPayableAmount: number;
  isDemoActive: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  expiresAtConfigured: boolean;
  expiresAtValid: boolean;
  demoEnabledFlag: boolean;
  demoAmountPhp: number | null;
  paypalValue: string;
  effectiveMode: 'demo' | 'real';
}

const resolveDemoPricingForAmount = (realAmount: unknown, { now = new Date() }: { now?: Date } = {}): DemoPricingStatus => {
  const realAmountNormalized = Number(toSafeNumber(realAmount) || 0);
  const config = getDemoPricingConfig();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const expiryMs = config.expiresAt.isValid && config.expiresAt.value ? new Date(config.expiresAt.value).getTime() : null;
  const isExpired = Boolean(config.expiresAt.isSet && config.expiresAt.isValid && Number.isFinite(expiryMs) && nowMs > (expiryMs as number));
  const hasValidAmount = config.demoAmountPhp != null;
  const canActivateDemo = config.enabledFlag && hasValidAmount && config.expiresAt.isValid && !isExpired;

  const providerPayableAmount = canActivateDemo ? Number(config.demoAmountPhp) : realAmountNormalized;
  const effectiveMode = canActivateDemo ? 'demo' as const : 'real' as const;

  return {
    realAmount: realAmountNormalized,
    providerPayableAmount,
    isDemoActive: canActivateDemo,
    isExpired,
    expiresAt: config.expiresAt.value,
    expiresAtConfigured: config.expiresAt.isSet,
    expiresAtValid: config.expiresAt.isValid,
    demoEnabledFlag: config.enabledFlag,
    demoAmountPhp: hasValidAmount ? Number(config.demoAmountPhp) : null,
    paypalValue: formatPhpAmount(providerPayableAmount),
    effectiveMode,
  };
};

const logDemoPricingStartupGuard = ({ now = new Date() }: { now?: Date } = {}): DemoPricingStatus => {
  const realProbeAmount = 999.99;
  const status = resolveDemoPricingForAmount(realProbeAmount, { now });

  if (status.isDemoActive) {
    console.warn(
      `DEMO PRICING WARNING: PAYMENT_DEMO_PRICING_ENABLED=true. Demo charges are ACTIVE. `
      + `All PayPal charges will use PHP ${status.paypalValue} while real plan amounts remain unchanged in internal records. `
      + `expires_at=${status.expiresAt || 'not-set'} mode=${status.effectiveMode}`
    );
    return status;
  }

  if (status.demoEnabledFlag && status.isExpired) {
    console.warn(
      `DEMO PRICING NOTICE: PAYMENT_DEMO_PRICING_ENABLED=true but demo pricing is AUTO-DISABLED `
      + `because PAYMENT_DEMO_PRICING_EXPIRES_AT has passed (${status.expiresAt}). Real pricing is now in effect.`
    );
    return status;
  }

  if (status.demoEnabledFlag && (!status.expiresAtValid || status.demoAmountPhp == null)) {
    console.warn(
      `DEMO PRICING NOTICE: PAYMENT_DEMO_PRICING_ENABLED=true but configuration is invalid `
      + `(demo_amount=${status.demoAmountPhp == null ? 'invalid' : status.demoAmountPhp}, `
      + `expires_at_valid=${status.expiresAtValid}). Real pricing is in effect.`
    );
  }

  return status;
};

module.exports = {
  formatPhpAmount,
  getDemoPricingConfig,
  resolveDemoPricingForAmount,
  logDemoPricingStartupGuard,
};
