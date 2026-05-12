// SSR-only semantic body content to fix Soft 404 verdicts on item pages.
//
// Problem: Expo Router static export suspends screen content during
// renderToString (see CLAUDE.md §3.1), so Googlebot gets a shell HTML with
// meta tags but an empty <body> — a classic Soft 404 trigger. RouteSEO
// already injects per-route <title>/<meta>, but crawlers also want a
// non-empty body with headings, paragraphs and internal links.
//
// This component emits exactly that: a visually-hidden <section> with a
// per-route <h1>, description, and internal link list. It's rendered at
// the layout level (same constraint as RouteSEO) so it survives SSR. The
// clip-rect visually-hidden pattern keeps it crawlable + screen-reader-
// accessible but invisible to sighted users — once the SPA hydrates and
// renders the real screen, this stub sits harmlessly in the DOM.
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { POPULAR_ITEMS } from '@/src/data/popularItems';
import { toTitleCase } from '@/src/api/tibiaMarket';
import { nameToSlug, normalizeToName } from '@/src/utils/itemSlug';

type Locale = 'en' | 'pl' | 'pt-BR';

const SITE_URL = 'https://tibiatrader.com';

// Standard "visually hidden" pattern — off-screen via clip-rect but present
// in the accessibility tree and the raw HTML Googlebot parses.
const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function resolveLocale(lang: string | string[] | undefined): Locale {
  const value = Array.isArray(lang) ? lang[0] : lang;
  if (value === 'pl') return 'pl';
  if (typeof value === 'string' && value.toLowerCase() === 'pt-br') return 'pt-BR';
  return 'en';
}

function itemHref(name: string): string {
  return `${SITE_URL}/item/${nameToSlug(name)}`;
}

function PopularItemsList({ locale, exclude }: { locale: Locale; exclude?: string }) {
  const heading =
    locale === 'pl'
      ? 'Popularne przedmioty'
      : locale === 'pt-BR'
        ? 'Itens populares'
        : 'Popular items';
  return (
    <section>
      <h2>{heading}</h2>
      <ul>
        {POPULAR_ITEMS.filter((n) => n !== exclude).map((name) => (
          <li key={name}>
            <a href={itemHref(name)}>{toTitleCase(name)}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>TibiaTrader — rynek Tibii w czasie rzeczywistym</h1>
        <p>
          Darmowy tracker cen rynkowych Tibii. Aktualne ceny kupna i sprzedaży na każdym świecie,
          marże flipów, alerty cenowe i historia wolumenów. Bez rejestracji, mobile-friendly.
        </p>
        <nav>
          <ul>
            <li>
              <a href={`${SITE_URL}/watchlist`}>Obserwowane i alerty cenowe</a>
            </li>
            <li>
              <a href={`${SITE_URL}/statistics`}>Statystyki rynku</a>
            </li>
            <li>
              <a href={`${SITE_URL}/world-select`}>Wybierz świat Tibii</a>
            </li>
          </ul>
        </nav>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>TibiaTrader — preços do mercado de Tibia em tempo real</h1>
        <p>
          Rastreador gratuito de preços do mercado de Tibia. Ofertas de compra e venda ao vivo em
          cada mundo, margens de flip, alertas de preço e histórico de volume de 90 dias. Sem
          cadastro, otimizado para mobile.
        </p>
        <nav>
          <ul>
            <li>
              <a href={`${SITE_URL}/watchlist`}>Lista de alertas de preço</a>
            </li>
            <li>
              <a href={`${SITE_URL}/statistics`}>Estatísticas do mercado</a>
            </li>
            <li>
              <a href={`${SITE_URL}/world-select`}>Escolha seu mundo de Tibia</a>
            </li>
          </ul>
        </nav>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>TibiaTrader — live Tibia market prices</h1>
      <p>
        Free Tibia market tracker. Live buy and sell offers across every world, flip margins, price
        alerts and 90-day volume history. No signup required, mobile-friendly.
      </p>
      <nav>
        <ul>
          <li>
            <a href={`${SITE_URL}/watchlist`}>Watchlist and price alerts</a>
          </li>
          <li>
            <a href={`${SITE_URL}/statistics`}>Market statistics</a>
          </li>
          <li>
            <a href={`${SITE_URL}/world-select`}>Select your Tibia world</a>
          </li>
        </ul>
      </nav>
      <PopularItemsList locale={locale} />
    </>
  );
}

function WatchlistContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Alerty cenowe Tibii</h1>
        <p>
          Ustaw alerty cen kupna i sprzedaży dla dowolnego przedmiotu w Tibii. Otrzymasz
          powiadomienie, gdy cena osiągnie Twój próg na wybranym świecie. Bezpłatnie, bez
          rejestracji.
        </p>
        <h2>Jak działają alerty</h2>
        <p>
          Wybierz przedmiot, podaj cenę progową (np. 500k) i kierunek — alert zadziała gdy aktualna
          oferta kupna spadnie poniżej lub oferta sprzedaży wzrośnie powyżej progu. Obsługujemy
          skróty gold: <strong>500k</strong> = 500 000, <strong>1.2m</strong> = 1 200 000.
        </p>
        <h2>Co możesz śledzić</h2>
        <ul>
          <li>Ceny kupna i sprzedaży dowolnego przedmiotu</li>
          <li>Margines flipa (różnica sprzedaż - kupno)</li>
          <li>Spadki cen poniżej historycznego minimum</li>
          <li>Wzrosty wolumenu handlu</li>
          <li>Zmiany cen na konkretnym świecie</li>
        </ul>
        <h2>Popularne przedmioty do obserwacji</h2>
        <p>
          Gracze najczęściej ustawiają alerty na mikstury (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>,{' '}
          <a href={itemHref('ultimate mana potion')}>Ultimate Mana Potion</a>), sprzęt end-game (
          <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>,{' '}
          <a href={itemHref('golden armor')}>Golden Armor</a>) oraz biżuterię (
          <a href={itemHref('stealth ring')}>Stealth Ring</a>,{' '}
          <a href={itemHref('might ring')}>Might Ring</a>,{' '}
          <a href={itemHref('prismatic ring')}>Prismatic Ring</a>).
        </p>
        <p>
          Obsługujemy wszystkie światy Tibii — Open PvP, Optional PvP i Hardcore. Dane rynkowe
          odświeżamy co godzinę, aby alerty wyzwalały się bez opóźnień.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Przejdź do pełnego rynku</a> lub{' '}
          <a href={`${SITE_URL}/statistics`}>zobacz statystyki rynku</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>Alertas de preço de Tibia</h1>
        <p>
          Configure alertas de preço de compra e venda para qualquer item de Tibia. Receba
          notificação quando o preço atingir seu alvo no mundo escolhido. Grátis, sem cadastro.
        </p>
        <h2>Como funcionam os alertas</h2>
        <p>
          Escolha um item, defina um preço-alvo (ex. 500k) e a direção — o alerta dispara quando a
          oferta de compra atual cair abaixo ou a oferta de venda subir acima do alvo. Suportamos
          atalhos de gold: <strong>500k</strong> = 500.000, <strong>1.2m</strong> = 1.200.000.
        </p>
        <h2>O que você pode acompanhar</h2>
        <ul>
          <li>Ofertas de compra e venda ao vivo de qualquer item negociável</li>
          <li>Margem de flip (venda menos compra)</li>
          <li>Quedas de preço abaixo de mínimas históricas</li>
          <li>Picos de volume indicando mudanças de demanda</li>
          <li>Movimentos de preço em um mundo específico</li>
        </ul>
        <h2>Itens mais monitorados</h2>
        <p>
          Os jogadores costumam alertar potions (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>,{' '}
          <a href={itemHref('ultimate mana potion')}>Ultimate Mana Potion</a>), equipamento end-game
          (<a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>,{' '}
          <a href={itemHref('golden armor')}>Golden Armor</a>) e joias (
          <a href={itemHref('stealth ring')}>Stealth Ring</a>,{' '}
          <a href={itemHref('might ring')}>Might Ring</a>,{' '}
          <a href={itemHref('prismatic ring')}>Prismatic Ring</a>).
        </p>
        <p>
          Todos os mundos de Tibia são suportados — Open PvP, Optional PvP e Hardcore. Os dados de
          mercado atualizam a cada hora para os alertas dispararem sem atraso.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Ver o mercado completo</a> ou{' '}
          <a href={`${SITE_URL}/statistics`}>ver as estatísticas</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>Tibia price alerts</h1>
      <p>
        Set buy and sell price alerts for any Tibia item. Get notified when the price hits your
        target on the world of your choice. Free, no signup.
      </p>
      <h2>How alerts work</h2>
      <p>
        Pick an item, enter a threshold price (e.g. 500k) and direction — the alert fires when the
        current buy offer drops below or the sell offer climbs above your target. Gold shortcuts
        supported: <strong>500k</strong> = 500,000, <strong>1.2m</strong> = 1,200,000.
      </p>
      <h2>What you can track</h2>
      <ul>
        <li>Live buy and sell offers for any tradeable item</li>
        <li>Flip margin (sell minus buy offer)</li>
        <li>Price drops below historical lows</li>
        <li>Volume spikes indicating demand shifts</li>
        <li>Price movements on a specific Tibia world</li>
      </ul>
      <h2>Most-watched items</h2>
      <p>
        Players most commonly alert on potions (
        <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
        <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>,{' '}
        <a href={itemHref('ultimate mana potion')}>Ultimate Mana Potion</a>), end-game gear (
        <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
        <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>,{' '}
        <a href={itemHref('golden armor')}>Golden Armor</a>) and jewelry (
        <a href={itemHref('stealth ring')}>Stealth Ring</a>,{' '}
        <a href={itemHref('might ring')}>Might Ring</a>,{' '}
        <a href={itemHref('prismatic ring')}>Prismatic Ring</a>).
      </p>
      <p>
        Every Tibia world is supported — Open PvP, Optional PvP and Hardcore. Market data refreshes
        hourly so alerts fire without delay.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Browse the full market</a> or{' '}
        <a href={`${SITE_URL}/statistics`}>see market statistics</a>.
      </p>
      <PopularItemsList locale={locale} />
    </>
  );
}

function StatisticsContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Statystyki rynku Tibii</h1>
        <p>
          Największe wzrosty i spadki cen, najczęściej handlowane przedmioty, największe marże
          flipów i miesięczny wolumen. Aktualizacja co godzinę, dane dla każdego świata.
        </p>
        <h2>Rankingi rynku</h2>
        <ul>
          <li>
            <strong>Najczęściej handlowane</strong> — przedmioty z najwyższym miesięcznym wolumenem
            sprzedaży i kupna
          </li>
          <li>
            <strong>Najczęściej kupowane</strong> — przedmioty z największą liczbą aktywnych ofert
            kupna
          </li>
          <li>
            <strong>Najdroższe oferty kupna</strong> — ranking po najwyższej cenie, jaką gracze są
            gotowi zapłacić
          </li>
          <li>
            <strong>Najdroższe oferty sprzedaży</strong> — ranking po cenie wystawienia
          </li>
        </ul>
        <h2>Do czego służą statystyki</h2>
        <p>
          Statystyki pomagają znaleźć okazje do flipowania (dużo handlu + duży spread), oszacować
          wartość drop&apos;u z hunta i śledzić trendy cenowe przed zmianami update&apos;ów Tibii.
          Dane zagregowane z całego rynku, aktualizowane co godzinę.
        </p>
        <h2>Najbardziej śledzone kategorie</h2>
        <p>
          Gracze najczęściej patrzą na statystyki dla{' '}
          <a href={itemHref('tibia coins')}>Tibia Coins</a>,{' '}
          <a href={itemHref('gold token')}>Gold Tokens</a>, mikstur (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('great spirit potion')}>Great Spirit Potion</a>,{' '}
          <a href={itemHref('ultimate health potion')}>Ultimate Health Potion</a>), sprzętu end-game
          (<a href={itemHref('demon legs')}>Demon Legs</a>,{' '}
          <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>) oraz biżuterii (
          <a href={itemHref('prismatic ring')}>Prismatic Ring</a>,{' '}
          <a href={itemHref('stone skin amulet')}>Stone Skin Amulet</a>).
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Przejdź do rynku</a> lub{' '}
          <a href={`${SITE_URL}/watchlist`}>ustaw alerty cenowe</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>Estatísticas do mercado de Tibia</h1>
        <p>
          Maiores variações, itens mais negociados, maiores margens de flip e volume mensal em cada
          mundo de Tibia. Atualizado a cada hora.
        </p>
        <h2>Rankings de mercado</h2>
        <ul>
          <li>
            <strong>Mais negociados</strong> — itens com maior volume mensal de compra e venda
          </li>
          <li>
            <strong>Mais comprados</strong> — itens com mais ofertas de compra ativas
          </li>
          <li>
            <strong>Compras mais caras</strong> — ranking pelo maior preço que jogadores estão
            dispostos a pagar
          </li>
          <li>
            <strong>Vendas mais caras</strong> — ranking pelo preço de listagem
          </li>
        </ul>
        <h2>Para que servem as estatísticas</h2>
        <p>
          As estatísticas ajudam a identificar oportunidades de flip (alto volume + spread amplo),
          estimar o valor do loot de uma hunt e acompanhar tendências de preço antes das updates de
          Tibia. Dados agregados de todo o mercado, atualizados a cada hora.
        </p>
        <h2>Categorias mais consultadas</h2>
        <p>
          Os jogadores costumam consultar estatísticas de{' '}
          <a href={itemHref('tibia coins')}>Tibia Coins</a>,{' '}
          <a href={itemHref('gold token')}>Gold Tokens</a>, potions (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('great spirit potion')}>Great Spirit Potion</a>,{' '}
          <a href={itemHref('ultimate health potion')}>Ultimate Health Potion</a>), equipamento
          end-game (<a href={itemHref('demon legs')}>Demon Legs</a>,{' '}
          <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>) e joias (
          <a href={itemHref('prismatic ring')}>Prismatic Ring</a>,{' '}
          <a href={itemHref('stone skin amulet')}>Stone Skin Amulet</a>).
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Ver o mercado</a> ou{' '}
          <a href={`${SITE_URL}/watchlist`}>configurar alertas</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>Tibia market statistics</h1>
      <p>
        Top movers, most-traded items, biggest flip margins and monthly volume across every Tibia
        world. Updated hourly.
      </p>
      <h2>Market rankings</h2>
      <ul>
        <li>
          <strong>Most traded</strong> — items with the highest monthly buy and sell volume
        </li>
        <li>
          <strong>Most purchased</strong> — items with the largest number of active buy offers
        </li>
        <li>
          <strong>Most expensive buy</strong> — ranked by the highest price players are willing to
          pay
        </li>
        <li>
          <strong>Most expensive sell</strong> — ranked by listing price
        </li>
      </ul>
      <h2>What statistics are for</h2>
      <p>
        Statistics help you spot flip opportunities (high volume + wide spread), estimate the value
        of loot from a hunt, and track price trends ahead of Tibia updates. Data is aggregated
        market-wide and refreshed hourly.
      </p>
      <h2>Most-watched categories</h2>
      <p>
        Players most often check stats for <a href={itemHref('tibia coins')}>Tibia Coins</a>,{' '}
        <a href={itemHref('gold token')}>Gold Tokens</a>, potions (
        <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
        <a href={itemHref('great spirit potion')}>Great Spirit Potion</a>,{' '}
        <a href={itemHref('ultimate health potion')}>Ultimate Health Potion</a>), end-game gear (
        <a href={itemHref('demon legs')}>Demon Legs</a>,{' '}
        <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
        <a href={itemHref('magic plate armor')}>Magic Plate Armor</a>) and jewelry (
        <a href={itemHref('prismatic ring')}>Prismatic Ring</a>,{' '}
        <a href={itemHref('stone skin amulet')}>Stone Skin Amulet</a>).
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Browse the market</a> or{' '}
        <a href={`${SITE_URL}/watchlist`}>set price alerts</a>.
      </p>
      <PopularItemsList locale={locale} />
    </>
  );
}

function WorldSelectContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Wybierz świat Tibii</h1>
        <p>
          Wybierz swój świat, aby zobaczyć aktualne ceny rynkowe, marże i trendy. Obsługujemy
          wszystkie światy Open PvP, Optional PvP i Hardcore. Każdy świat ma własne ceny i wolumen —
          wybór świata decyduje, które oferty widzisz na liście rynku i w alertach cenowych.
        </p>
        <h2>Typy światów</h2>
        <ul>
          <li>
            <strong>Open PvP</strong> — Antica, Lobera, Menera, Pacera, Serdebra, Wintera, Secura,
            Talera — otwarta walka między graczami, najbardziej aktywny rynek
          </li>
          <li>
            <strong>Optional PvP</strong> — Belluma, Quintera, Zuna, Zunera — walka tylko za zgodą,
            popularne dla graczy PvE
          </li>
          <li>
            <strong>Hardcore PvP</strong> — Gravitera, Kalibra, Ysolera — brak zabezpieczeń, PK bez
            skill loss
          </li>
          <li>
            <strong>Retro Open PvP / Retro Hardcore</strong> — klasyczne mechaniki, mniejszy rynek
            ale unikalne ceny
          </li>
        </ul>
        <h2>Czym różnią się rynki</h2>
        <p>
          Ceny przedmiotów potrafią różnić się nawet o 20–30% między światami — zwłaszcza dla
          rzadkich itemów jak <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('golden armor')}>Golden Armor</a> czy{' '}
          <a href={itemHref('demon legs')}>Demon Legs</a>. Mikstury (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>) mają stabilniejsze
          ceny dzięki dużemu wolumenowi.
        </p>
        <p>
          Wybór świata zapamiętujemy lokalnie — wracając na stronę od razu widzisz swój rynek. Świat
          możesz zmienić w dowolnej chwili z menu nawigacji.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Przejdź do rynku</a>,{' '}
          <a href={`${SITE_URL}/statistics`}>zobacz statystyki</a> lub{' '}
          <a href={`${SITE_URL}/watchlist`}>ustaw alerty</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>Escolha seu mundo de Tibia</h1>
        <p>
          Selecione seu mundo para ver preços de mercado ao vivo, margens e tendências. Suportamos
          todos os mundos Open PvP, Optional PvP e Hardcore. Cada mundo tem preços e volume próprios
          — a sua escolha define quais ofertas aparecem na lista do mercado e nos alertas de preço.
        </p>
        <h2>Tipos de mundo</h2>
        <ul>
          <li>
            <strong>Open PvP</strong> — Antica, Lobera, Menera, Pacera, Serdebra, Wintera, Secura,
            Talera — combate aberto entre jogadores, mercados mais ativos
          </li>
          <li>
            <strong>Optional PvP</strong> — Belluma, Quintera, Zuna, Zunera — combate apenas com
            consentimento, popular entre jogadores PvE
          </li>
          <li>
            <strong>Hardcore PvP</strong> — Gravitera, Kalibra, Ysolera — sem proteções, killers
            mantêm habilidades
          </li>
          <li>
            <strong>Retro Open PvP / Retro Hardcore</strong> — mecânicas clássicas, mercados menores
            e preços únicos
          </li>
        </ul>
        <h2>Como os mercados diferem</h2>
        <p>
          Os preços de itens podem variar 20–30% entre mundos — especialmente para gear raro como{' '}
          <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
          <a href={itemHref('golden armor')}>Golden Armor</a> ou{' '}
          <a href={itemHref('demon legs')}>Demon Legs</a>. Potions (
          <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
          <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>) ficam mais estáveis
          pelo alto volume.
        </p>
        <p>
          Sua escolha de mundo é salva localmente — ao voltar ao site você já vê seu mercado. Pode
          trocar de mundo a qualquer momento pelo menu de navegação.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Ver o mercado</a>,{' '}
          <a href={`${SITE_URL}/statistics`}>ver estatísticas</a> ou{' '}
          <a href={`${SITE_URL}/watchlist`}>configurar alertas</a>.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>Select your Tibia world</h1>
      <p>
        Pick your Tibia world to see live market prices, margins and trends. Every Open PvP,
        Optional PvP and Hardcore world is supported. Each world has its own prices and trade volume
        — your world selection determines which offers you see on the market list and in price
        alerts.
      </p>
      <h2>World types</h2>
      <ul>
        <li>
          <strong>Open PvP</strong> — Antica, Lobera, Menera, Pacera, Serdebra, Wintera, Secura,
          Talera — open player combat, the busiest markets
        </li>
        <li>
          <strong>Optional PvP</strong> — Belluma, Quintera, Zuna, Zunera — combat only with
          consent, popular among PvE players
        </li>
        <li>
          <strong>Hardcore PvP</strong> — Gravitera, Kalibra, Ysolera — no safeguards, killers
          retain full skills
        </li>
        <li>
          <strong>Retro Open PvP / Retro Hardcore</strong> — classic mechanics, smaller markets but
          unique pricing
        </li>
      </ul>
      <h2>How markets differ</h2>
      <p>
        Item prices can differ by 20–30% between worlds — especially for rare gear like{' '}
        <a href={itemHref('boots of haste')}>Boots of Haste</a>,{' '}
        <a href={itemHref('golden armor')}>Golden Armor</a> or{' '}
        <a href={itemHref('demon legs')}>Demon Legs</a>. Potions (
        <a href={itemHref('great mana potion')}>Great Mana Potion</a>,{' '}
        <a href={itemHref('supreme health potion')}>Supreme Health Potion</a>) stay more stable
        thanks to high volume.
      </p>
      <p>
        Your world choice is stored locally — next time you open the site you see your market
        straight away. You can switch worlds any time from the navigation menu.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Browse the market</a>,{' '}
        <a href={`${SITE_URL}/statistics`}>see statistics</a> or{' '}
        <a href={`${SITE_URL}/watchlist`}>set alerts</a>.
      </p>
      <PopularItemsList locale={locale} />
    </>
  );
}

function ItemContent({ name, locale }: { name: string; locale: Locale }) {
  const title = toTitleCase(name);
  if (locale === 'pl') {
    return (
      <>
        <h1>{title} — cena rynkowa w Tibii</h1>
        <p>
          Aktualna cena {title} na rynku Tibii: oferty kupna i sprzedaży, marża flipa, miesięczny
          wolumen i 90-dniowa historia cen na każdym świecie. Dane aktualizowane co godzinę.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Wróć do pełnego rynku</a>
        </p>
        <PopularItemsList locale={locale} exclude={name} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>{title} — preço de mercado em Tibia</h1>
        <p>
          Dados ao vivo de {title} no mercado de Tibia: ofertas de compra e venda, margem de flip,
          volume mensal e histórico de preços de 90 dias em cada mundo. Atualização a cada hora.
        </p>
        <p>
          <a href={`${SITE_URL}/`}>Voltar ao mercado completo</a>
        </p>
        <PopularItemsList locale={locale} exclude={name} />
      </>
    );
  }
  return (
    <>
      <h1>{title} — live Tibia market price</h1>
      <p>
        Live {title} market data on Tibia: buy and sell offers, flip margin, monthly volume and
        90-day price history across every world. Hourly updates.
      </p>
      <p>
        <a href={`${SITE_URL}/`}>Back to the full market</a>
      </p>
      <PopularItemsList locale={locale} exclude={name} />
    </>
  );
}

function ItemTemplateContent({ locale }: { locale: Locale }) {
  if (locale === 'pl') {
    return (
      <>
        <h1>Ceny przedmiotów Tibii</h1>
        <p>
          Wyszukaj dowolny przedmiot, aby zobaczyć aktualne oferty kupna i sprzedaży, marżę flipa i
          historię cen na każdym świecie.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  if (locale === 'pt-BR') {
    return (
      <>
        <h1>Preços de itens de Tibia</h1>
        <p>
          Busque qualquer item para ver ofertas de compra e venda ao vivo, margem de flip e
          histórico de preços em cada mundo.
        </p>
        <PopularItemsList locale={locale} />
      </>
    );
  }
  return (
    <>
      <h1>Tibia item prices</h1>
      <p>
        Look up any Tibia item to see live buy and sell offers, flip margin and price history across
        every world.
      </p>
      <PopularItemsList locale={locale} />
    </>
  );
}

function contentForPath(pathname: string | null, locale: Locale): React.ReactNode {
  const path = pathname || '/';
  const itemMatch = path.match(/^\/item\/([^/?#]+)/);
  if (itemMatch) {
    const raw = decodeURIComponent(itemMatch[1]);
    if (raw === '[name]') return <ItemTemplateContent locale={locale} />;
    // Route segment can be either a slug or a legacy space-form name. Map
    // both to the API name so ItemContent renders the same body regardless
    // of how the visitor arrived.
    return <ItemContent name={normalizeToName(raw)} locale={locale} />;
  }
  const normalized = path.replace(/\?.*$/, '').replace(/#.*$/, '').replace('/(tabs)', '') || '/';
  if (normalized === '/') return <HomeContent locale={locale} />;
  if (normalized === '/watchlist') return <WatchlistContent locale={locale} />;
  if (normalized === '/statistics') return <StatisticsContent locale={locale} />;
  if (normalized === '/world-select') return <WorldSelectContent locale={locale} />;
  return null;
}

export default function SEOContent() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ lang?: string }>();
  const locale = resolveLocale(params.lang);
  const content = contentForPath(pathname, locale);
  if (!content) return null;
  return (
    <section data-seo="body" style={visuallyHidden}>
      {content}
    </section>
  );
}
