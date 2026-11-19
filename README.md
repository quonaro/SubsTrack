# SubsTrack

📱 Локальный трекер подписок: Vue 3 + Reka UI + Capacitor для Android.
Все данные — в SQLite на устройстве, никакого бэкенда.

## Возможности

- Подписки с гибким периодом оплаты (7/30/90/365 дней или свой)
- Категории с иконками и цветами
- Напоминания: за N дней, в день платежа, повторяющиеся — локальные
  уведомления на устройстве
- Календарь платежей, история событий, статистика по категориям и месяцам
- Мультивалютность (RUB/USD/EUR/KZT/BYN, статические курсы)
- Самообновление через GitHub Releases (sideload APK)
- Восстановление последней открытой страницы при запуске
- Тёмная и светлая тема

## Разработка

```bash
pnpm install        # зависимости
pnpm dev            # веб-дев на :7358 (SQLite через sql.js+IndexedDB)
pnpm test           # тесты (Vitest, реальный SQLite через sql.js)
pnpm typecheck      # vue-tsc
pnpm lint           # Biome
pnpm build          # сборка → dist/
pnpm cap:sync       # синк веб-бандла в android/
lota build apk      # debug APK
lota build apk:release  # release APK (нужен android/keystore.properties)
```

## Релиз

Тег `v*.*.*` на `main` → GitHub Actions собирает подписанный APK и
публикует `substrack-<tag>.apk` в Releases. Приложение само проверяет
новые релизы и предлагает обновление.

Требуемые секреты: `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
`KEY_ALIAS`, `KEY_PASSWORD`.

Подробности архитектуры — в `AGENTS.md`.
