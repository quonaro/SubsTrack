/**
 * Russian translation map for common timezones
 */
export const timezoneNamesRu: Record<string, string> = {
    // Europe
    'Europe/Moscow': 'Москва',
    'Europe/Kaliningrad': 'Калининград',
    'Europe/Samara': 'Самара',
    'Europe/Volgograd': 'Волгоград',
    'Europe/Saratov': 'Саратов',
    'Europe/Ulyanovsk': 'Ульяновск',
    'Europe/Kirov': 'Киров',
    'Europe/Astrakhan': 'Астрахань',
    'Europe/London': 'Лондон',
    'Europe/Paris': 'Париж',
    'Europe/Berlin': 'Берлин',
    'Europe/Rome': 'Рим',
    'Europe/Madrid': 'Мадрид',
    'Europe/Amsterdam': 'Амстердам',
    'Europe/Brussels': 'Брюссель',
    'Europe/Vienna': 'Вена',
    'Europe/Zurich': 'Цюрих',
    'Europe/Prague': 'Прага',
    'Europe/Warsaw': 'Варшава',
    'Europe/Kiev': 'Киев',
    'Europe/Kyiv': 'Киев',
    'Europe/Minsk': 'Минск',
    'Europe/Riga': 'Рига',
    'Europe/Tallinn': 'Таллин',
    'Europe/Vilnius': 'Вильнюс',
    'Europe/Helsinki': 'Хельсинки',
    'Europe/Stockholm': 'Стокгольм',
    'Europe/Oslo': 'Осло',
    'Europe/Copenhagen': 'Копенгаген',
    'Europe/Dublin': 'Дублин',
    'Europe/Lisbon': 'Лиссабон',
    'Europe/Athens': 'Афины',
    'Europe/Istanbul': 'Стамбул',
    'Europe/Belgrade': 'Белград',
    'Europe/Bucharest': 'Бухарест',
    'Europe/Budapest': 'Будапешт',
    'Europe/Sofia': 'София',

    // Asia - Russia
    'Asia/Yekaterinburg': 'Екатеринбург',
    'Asia/Omsk': 'Омск',
    'Asia/Novosibirsk': 'Новосибирск',
    'Asia/Barnaul': 'Барнаул',
    'Asia/Tomsk': 'Томск',
    'Asia/Novokuznetsk': 'Новокузнецк',
    'Asia/Krasnoyarsk': 'Красноярск',
    'Asia/Irkutsk': 'Иркутск',
    'Asia/Chita': 'Чита',
    'Asia/Yakutsk': 'Якутск',
    'Asia/Vladivostok': 'Владивосток',
    'Asia/Sakhalin': 'Сахалин',
    'Asia/Magadan': 'Магадан',
    'Asia/Srednekolymsk': 'Среднеколымск',
    'Asia/Kamchatka': 'Камчатка',
    'Asia/Anadyr': 'Анадырь',

    // Asia - Other
    'Asia/Dubai': 'Дубай',
    'Asia/Tbilisi': 'Тбилиси',
    'Asia/Yerevan': 'Ереван',
    'Asia/Baku': 'Баку',
    'Asia/Tashkent': 'Ташкент',
    'Asia/Almaty': 'Алматы',
    'Asia/Bishkek': 'Бишкек',
    'Asia/Dushanbe': 'Душанбе',
    'Asia/Ashgabat': 'Ашхабад',
    'Asia/Tokyo': 'Токио',
    'Asia/Seoul': 'Сеул',
    'Asia/Shanghai': 'Шанхай',
    'Asia/Hong_Kong': 'Гонконг',
    'Asia/Singapore': 'Сингапур',
    'Asia/Bangkok': 'Бангкок',
    'Asia/Jakarta': 'Джакарта',
    'Asia/Kolkata': 'Калькутта',
    'Asia/Tehran': 'Тегеран',
    'Asia/Jerusalem': 'Иерусалим',
    'Asia/Riyadh': 'Эр-Рияд',

    // Americas
    'America/New_York': 'Нью-Йорк',
    'America/Chicago': 'Чикаго',
    'America/Los_Angeles': 'Лос-Анджелес',
    'America/Toronto': 'Торонто',
    'America/Vancouver': 'Ванкувер',
    'America/Mexico_City': 'Мехико',
    'America/Sao_Paulo': 'Сан-Паулу',
    'America/Buenos_Aires': 'Буэнос-Айрес',
    'America/Santiago': 'Сантьяго',
    'America/Bogota': 'Богота',
    'America/Lima': 'Лима',
    'America/Caracas': 'Каракас',

    // Australia & Pacific
    'Australia/Sydney': 'Сидней',
    'Australia/Melbourne': 'Мельбурн',
    'Australia/Brisbane': 'Брисбен',
    'Australia/Adelaide': 'Аделаида',
    'Australia/Perth': 'Перт',
    'Pacific/Auckland': 'Окленд',
    'Pacific/Fiji': 'Фиджи',
    'Pacific/Honolulu': 'Гонолулу',

    // Africa
    'Africa/Cairo': 'Каир',
    'Africa/Johannesburg': 'Йоханнесбург',
    'Africa/Lagos': 'Лагос',
    'Africa/Nairobi': 'Найроби',
    'Africa/Abidjan': 'Абиджан',
    'Africa/Accra': 'Аккра',
    'Africa/Addis_Ababa': 'Аддис-Абеба',
    'Africa/Algiers': 'Алжир',
    'Africa/Casablanca': 'Касабланка',
    'Africa/Tunis': 'Тунис',

    // UTC
    'UTC': 'UTC'
}

export function getTimezoneName(tz: string): string {
    if (timezoneNamesRu[tz]) return timezoneNamesRu[tz]

    // Fallback: try to extract city and translate if obvious, or just format
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
    return city
}
