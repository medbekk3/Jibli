# إعداد Firebase لمشروع جيبلي

## ربط المشروع

1. أنشئ مشروعاً وتطبيق ويب داخل Firebase Console.
2. فعّل تسجيل الدخول بالبريد الإلكتروني وكلمة المرور من قسم المصادقة.
3. أنشئ قاعدة Cloud Firestore في وضع الإنتاج.
4. انسخ `.env.example` إلى `.env.local` وضع قيم تطبيق الويب.
5. انشر محتوى `firestore.rules` من تبويب القواعد أو باستعمال Firebase CLI.
6. انشر `firestore.indexes.json` حتى يعمل استعلام الأكلات المتوفرة حسب المطعم.

## إنشاء حساب إدارة أو مطعم تجريبي

1. أنشئ المستخدم يدوياً من Firebase Authentication دون حفظ كلمة مروره داخل المشروع.
2. انسخ `uid` الخاص به.
3. أنشئ وثيقة داخل `users` يكون معرفها هو نفس `uid`.
4. أضف الحقول: `uid`, `firstName`, `lastName`, `fullName`, `phone`, `email`, `role`, `status`, `createdAt`, `updatedAt`.
5. لحساب الإدارة استعمل `role: admin` و`status: active`.
6. لحساب المطعم استعمل `role: restaurant` و`status: pending`، ثم غيّر الحالة إلى `active` بعد الموافقة.
7. استعمل نوع Timestamp لحقلي الوقت.

يُنشأ أول حساب إدارة من Firebase Console لأن التطبيق لا يوفر ترقية ذاتية، وهذا يمنع المستخدم العادي من منح نفسه صلاحية الإدارة.
