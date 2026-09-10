// ============================================================================
// Payme Merchant API — xatolar katalogi va JSON-RPC konvertlari
// https://developer.help.paycom.uz/metody-merchant-api/oshibki-errors
// ============================================================================

export interface PaymeErrorDef {
  code: number;
  message: { uz: string; ru: string; en: string };
  /** `account` ning muammoli maydoni nomi — -31050..-31099 uchun majburiy. */
  data?: string;
}

/**
 * -31050..-31099 kodlari `account` kiritishdagi muammolar uchun ajratilgan va
 * ular lokalizatsiya qilingan `message` hamda maydon nomini olib yurishi shart.
 */
export const PaymeError = {
  // ── Protokol darajasi ───────────────────────────────────────────────────
  NotPost: {
    code: -32300,
    message: {
      uz: "So'rov POST bo'lishi kerak",
      ru: "Запрос должен быть методом POST",
      en: "Request method must be POST",
    },
  },
  ParseError: {
    code: -32700,
    message: {
      uz: "JSON o'qishda xatolik",
      ru: "Ошибка парсинга JSON",
      en: "JSON parse error",
    },
  },
  InvalidRpc: {
    code: -32600,
    message: {
      uz: "So'rovda majburiy maydonlar yo'q yoki turi noto'g'ri",
      ru: "Отсутствуют обязательные поля запроса или неверный тип",
      en: "Missing required RPC fields or wrong type",
    },
  },
  MethodNotFound: {
    code: -32601,
    message: {
      uz: "Metod topilmadi",
      ru: "Запрашиваемый метод не найден",
      en: "Method not found",
    },
  },
  InvalidAuthorization: {
    code: -32504,
    message: {
      uz: "Metodni bajarish uchun huquq yetarli emas",
      ru: "Недостаточно привилегий для выполнения метода",
      en: "Insufficient privileges to execute the method",
    },
  },
  InternalError: {
    code: -32400,
    message: {
      uz: "Tizimda ichki xatolik",
      ru: "Внутренняя системная ошибка",
      en: "Internal system error",
    },
  },

  // ── Biznes darajasi ─────────────────────────────────────────────────────
  InvalidAmount: {
    code: -31001,
    message: {
      uz: "Noto'g'ri summa",
      ru: "Неверная сумма",
      en: "Invalid amount",
    },
  },
  TransactionNotFound: {
    code: -31003,
    message: {
      uz: "Tranzaksiya topilmadi",
      ru: "Транзакция не найдена",
      en: "Transaction not found",
    },
  },
  CantDoOperation: {
    code: -31008,
    message: {
      uz: "Amalni bajarib bo'lmaydi",
      ru: "Невозможно выполнить операцию",
      en: "Unable to perform operation",
    },
  },

  // ── Hisob darajasi (-31050..-31099) ─────────────────────────────────────
  UserNotFound: {
    code: -31050,
    message: {
      uz: "Bunday email bilan foydalanuvchi topilmadi",
      ru: "Пользователь с таким email не найден",
      en: "No user found with this email",
    },
    data: "email",
  },
  AccountBusy: {
    code: -31051,
    message: {
      uz: "Ushbu email bo'yicha to'lov allaqachon jarayonda. Uni yakunlang yoki bekor qiling.",
      ru: "По этому email уже есть незавершённый платёж. Завершите или отмените его.",
      en: "A payment for this email is already in progress. Finish or cancel it first.",
    },
    data: "email",
  },
  AlreadyPaid: {
    code: -31052,
    message: {
      uz: "Sizda faol PRO obuna mavjud. Muddati tugagach qayta sotib olishingiz mumkin.",
      ru: "У вас уже есть активная PRO подписка. Купить снова можно после её окончания.",
      en: "You already have an active PRO subscription. You can buy again once it expires.",
    },
    data: "email",
  },
} as const satisfies Record<string, PaymeErrorDef>;

/** Muvaffaqiyat konverti. `id` aynan qaytariladi, HTTP status doim 200. */
export function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

/** Xato konverti. */
export function rpcError(id: unknown, err: PaymeErrorDef) {
  const body: Record<string, unknown> = { code: err.code, message: err.message };
  if (err.data !== undefined) body.data = err.data;
  return { jsonrpc: "2.0", id: id ?? null, error: body };
}

/** SQL qatlami qaytargan `{ok:false, error:'...'}` ni Payme xatosiga o'giradi. */
export function dbErrorToPayme(errorCode: string): PaymeErrorDef {
  switch (errorCode) {
    case "user_not_found":
      return PaymeError.UserNotFound;
    case "account_busy":
      return PaymeError.AccountBusy;
    case "already_paid":
      return PaymeError.AlreadyPaid;
    case "invalid_amount":
      return PaymeError.InvalidAmount;
    case "cant_do_operation":
      return PaymeError.CantDoOperation;
    case "transaction_not_found":
      return PaymeError.TransactionNotFound;
    default:
      return PaymeError.CantDoOperation;
  }
}
