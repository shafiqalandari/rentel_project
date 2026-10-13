# Market Rental Management | Local Edition

## نصب و اجرا

1. از معلومات فعلی خود از داخل Settings بکاپ JSON بگیرید.
2. ZIP را استخراج کنید و تمام پوشه `market-rental-system` را جایگزین پروژه قبلی نمایید.
3. در همین پوشه `npm install` سپس `npm run dev` اجرا کنید.
4. آدرس نمایش داده‌شده (معمولاً http://localhost:5173) را باز کنید.

ورود پیش‌فرض آزمایشی: `admin@gmail.com` / `mynameisadmin`

## اطلاعات
اطلاعات در LocalStorage همان مرورگر با کلید `market_rental_offline_v1` نگهداری می‌شود. فایل‌های پروژه را جایگزین کنید اما داده‌های مرورگر را پاک نکنید. آدرس و مرورگر قبلی را حفظ کنید. مرتب از Settings بکاپ بگیرید.

## ساختار
`src/pages/` حاوی صفحات جداگانه است. فایل `src/main.tsx` پوسته، ورود و فرم‌های عمومی را مدیریت می‌کند. `src/local-api.ts` منطق ذخیره‌سازی محلی را فراهم می‌کند. برنامه در این نسخه نیاز به PostgreSQL و سرور ندارد.

## محدودیت
این نسخه برای استفاده محلی تک‌مرورگری است و احراز هویت محلی برای داده‌های حساس یا کاربرد چندکاربره امن نیست. Build کامل در محیط تولید این بسته به‌دلیل نبودن بسته‌های npm قابل تأیید نبود.

## Hidden scrollbar behavior

All native scrollbars in the app, including the main page, side navigation,
shop forms, dialogs, tables and dropdown lists, are visually hidden.
Scrolling by mouse wheel, trackpad, touch and keyboard remains enabled.
No changes were made to localStorage keys, login, or financial logic.
