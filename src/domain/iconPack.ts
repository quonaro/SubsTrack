/**
 * Minimalist line-icon pack for subscriptions and categories.
 *
 * Format: `name keyword keyword …` — one icon per line, `#` starts a group.
 * Names are Lucide icon ids (see `src/icons/paths.ts`); keywords are lowercase
 * Russian/English and power the picker's search.
 */
export const RAW_ICON_PACK = `
# Медиа
tv телевизор тв television
film плёнка кинолента фильм reel
clapperboard кино фильм clapper
video видео ролик
play воспроизведение play
headphones наушники музыка audio
music музыка нота melody
radio радио эфир
mic микрофон запись
mic-vocal микрофон караоке karaoke
podcast подкаст podcast
newspaper газета новости news
book-open книга чтение book reading
gamepad-2 игры геймпад gaming
joystick джойстик аркада arcade
dices игры кубики dice games
dice-5 настольные игры board games
popcorn кино попкорн cinema
ticket билет события tickets
guitar гитара музыка guitar
piano пианино музыка piano
drum барабаны музыка drums
puzzle пазл головоломка puzzle
palette рисование искусство art painting
telescope телескоп астрономия astronomy

# Сервисы
youtube ютуб видео youtube
twitch твич стрим streaming
twitter твиттер соцсеть social
instagram инстаграм соцсеть social
facebook фейсбук соцсеть social
github гитхаб код разработка code
gitlab гитлаб код разработка code
figma фигма дизайн design
chrome браузер хром browser
slack слак работа чат chat
linkedin линкед ин работа social

# Техника
smartphone телефон смартфон phone mobile
laptop ноутбук компьютер laptop
monitor монитор компьютер desktop
keyboard клавиатура keyboard
mouse мышь mouse
printer принтер печать printer
camera камера фото camera photo
satellite спутник satellite
wifi интернет вайфай internet
router роутер router
cloud облако cloud
server сервер server
hard-drive диск память storage
cpu процессор processor
circuit-board плата электроника chip
bot робот бот robot bot
brain ии интеллект ai
battery-charging батарея зарядка battery charger
plug розетка вилка зарядка plug charger
cable кабель провод cable
lightbulb лампочка идея bulb idea
flashlight фонарик flashlight
magnet магнит magnet
search поиск лупа search
shield-check защита безопасность security
lock замок защита lock
lock-open открытый замок unlock
fingerprint отпечаток биометрия biometrics

# Работа и деньги
briefcase портфель работа business work
wallet кошелёк деньги wallet
credit-card карта оплата payment
banknote деньги наличные cash
coins монеты деньги coins
piggy-bank копилка накопления savings
receipt чек квитанция receipt
calculator калькулятор расчёт calculator
chart-line график рост chart
chart-bar график статистика stats
chart-pie график диаграмма pie
trending-up рост график growth
trending-down падение график fall
calendar календарь дата calendar
calendar-days календарь даты planner
file-text документ файл document
folder папка файлы folder
archive архив archive
scale весы юстиция law
building-2 офис здание office company
store магазин shop store
graduation-cap учёба образование study
presentation презентация доклад slide
pen-tool дизайн вектор design
notebook-pen заметка запись note
landmark банк bank
package посылка прочее package
clipboard-list список чеклист list
users-round команда клиенты team

# Еда и напитки
coffee кофе coffee
pizza пицца pizza
sandwich сэндвич бутерброд sandwich
beef мясо стейк meat steak
salad салат salad
soup суп soup
utensils еда вилка ложка food
utensils-crossed ресторан кафе restaurant
chef-hat повар ресторан chef
cake торт десерт cake dessert
ice-cream-cone мороженое icecream
croissant круассан выпечка croissant bakery
beer пиво beer
wine вино wine
martini коктейль cocktail
cup-soda напиток газировка soda drink
milk молоко milk
apple яблоко фрукт apple fruit
carrot овощи морковь vegetables
candy конфета сладости candy
donut пончик donut
cookie печенье cookie

# Дом и быт
house дом home
key ключ key
sofa диван couch sofa
bed кровать bed
lamp лампа свет lamp light
washing-machine стирка laundry
trash-2 мусор корзина trash
wrench инструмент ремонт wrench tool
hammer молоток hammer tool
drill дрель drill tool
paint-roller ремонт покраска paint
shower-head душ shower
toilet туалет toilet
shirt одежда футболка clothes
thermometer температура градусник thermometer
sparkles блеск чистота sparkle
flame огонь пламя fire
fan вентилятор fan
heater обогреватель heater
refrigerator холодильник fridge
microwave микроволновка microwave
cooking-pot готовка кастрюля cooking

# Транспорт и путешествия
car машина автомобиль car auto
bus автобус bus
train-front поезд train
plane самолёт перелёт plane flight
plane-takeoff взлёт departure
plane-landing посадка arrival
ship корабль ship
sailboat парусник яхта sailboat yacht
bike велосипед bike bicycle
fuel бензин заправка fuel
map карта путешествие map travel
compass компас compass
luggage чемодан багаж luggage
tent палатка кемпинг tent camping
mountain горы mountain
mountain-snow горы лыжи ski
tree-palm пальма пляж palm beach
anchor якорь anchor
route маршрут route
map-pin место метка location
globe глобус мир globe world
rocket ракета старт rocket
hotel отель hotel
umbrella зонт umbrella

# Здоровье и спорт
dumbbell спортзал штанга fitness gym
heart-pulse здоровье пульс health pulse
stethoscope врач стетоскоп doctor
pill таблетки лекарство pills medicine
syringe укол вакцина vaccine
activity активность пульс activity
waves плавание волны swim
trophy кубок трофей trophy
medal медаль medal
target цель мишень target
footprints бег шаги run steps
ambulance скорая ambulance
cross медицина аптека medical
hospital больница hospital
bandage травма пластырь injury
person-standing йога осанка yoga
timer таймер timer
alarm-clock будильник alarm
hourglass время песочные часы time
repeat регулярно повторение repeat

# Красота и шопинг
shopping-bag покупки сумка shopping
shopping-cart корзина магазин cart
glasses очки glasses
watch часы watch
gem драгоценность алмаз gem diamond
crown корона crown
scissors ножницы стрижка scissors
gift подарок gift present
tag скидка тег tag
percent скидка процент discount
heart сердце любовь heart love
flower роза цветок rose
flower-2 цветок flower
brush макияж кисть makeup brush

# Природа и питомцы
tree-pine дерево ель ёлка tree fir
tree-deciduous дерево лес tree
leaf листья лист leaf
leafy-green зелень трава green
clover клевер удача clover luck
sprout росток растение sprout plant
sun солнце sun
moon луна ночь moon night
star звезда рейтинг star
cloud-rain дождь rain
cloud-sun погода sun cloud
snowflake снег зима snow winter
rainbow радуга rainbow
cat кот кошка питомец cat pet
dog собака пёс питомец dog pet
bird птица bird
fish рыба fish
fish-symbol рыба fish
paw-print лапы питомец paw pet
bug жук насекомое насекомые bug insect
squirrel белка squirrel
turtle черепаха turtle
snail улитка snail
shell ракушка shell
feather перо feather
egg яйцо egg

# Символы
check галочка готово check done
x крестик нет cross
triangle-alert внимание предупреждение warning
circle-help вопрос help
info информация info
bell уведомление колокольчик bell notification
bell-off без звука mute
message-circle сообщение чат chat
bookmark закладка bookmark
link ссылка link
eye просмотр eye
zap молния быстро zap
thumbs-up лайк like
thumbs-down дизлайк dislike
ban запрет ban
clock время часы time clock
infinity бесконечность infinity
flag флаг flag
recycle переработка recycle
refresh-ccw обновление refresh
shuffle случайно shuffle
`
