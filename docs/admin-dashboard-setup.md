# إعداد لوحة إدارة جيبلي

## Firebase Admin SDK

أنشئ حساب خدمة من إعدادات مشروع Firebase، ثم أضف القيم التالية إلى `.env.local` فقط:

```text
FIREBASE_ADMIN_PROJECT_ID=معرف_المشروع
FIREBASE_ADMIN_CLIENT_EMAIL=بريد_حساب_الخدمة
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

لا تستعمل بادئة `NEXT_PUBLIC_` لهذه القيم، ولا ترفع `.env.local` إلى Git.

تستعمل لوحة الإدارة جلسة خادمية آمنة في ملف تعريف ارتباط `HttpOnly`. بعد إضافة متغيرات الخادم، سجّل خروج المدير ثم ادخل من جديد لإنشاء الجلسة.

## النشر

راجع مشروع Firebase المحدد ثم انشر القواعد والفهارس:

```text
firebase deploy --only firestore
```

تأكد من أن وثيقة المدير في `users/{uid}` تحتوي على `role = admin` و`status = active`.

## Cloudinary

يجب إعداد Upload Preset غير موقّع ومقيّد بالصور، مع الاحتفاظ باسم السحابة واسم الإعداد في متغيرات `NEXT_PUBLIC_CLOUDINARY_*`. لا يحتاج المتصفح إلى API Secret.
