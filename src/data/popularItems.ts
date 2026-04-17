// Curated list of well-known Tibia items that get pre-rendered as static
// HTML pages during `expo export` (see generateStaticParams in
// app/item/[name].tsx). Mirrored in public/sitemap.xml so Google crawls them.
//
// Selection is a mix of high-value gear, commonly-traded potions/runes and
// late-game set pieces — items players actively search for. Keep the list
// stable; append rather than rewrite so canonical URLs don't churn.
//
// Names match the API's raw item name (lowercase, spaces preserved). They
// are the URL segment after encoding — e.g. "demon legs" → "/item/demon%20legs".

export const POPULAR_ITEMS: string[] = [
  'demon legs',
  'magic plate armor',
  'golden armor',
  'royal helmet',
  'crown armor',
  'crown legs',
  'crown helmet',
  'crown shield',
  'mastermind shield',
  'demon shield',
  'great health potion',
  'great mana potion',
  'supreme health potion',
  'ultimate health potion',
  'ultimate spirit potion',
  'ultimate mana potion',
  'strong mana potion',
  'strong health potion',
  'might ring',
  'life ring',
  'stealth ring',
  'gold ring',
  'terra boots',
  'fire sword',
  'magic longsword',
];
