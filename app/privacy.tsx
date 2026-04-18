import React from 'react';
import { ScrollView, View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { useTranslation } from '@/src/context/LanguageContext';
import { colors } from '@/src/theme/colors';

const LAST_UPDATED = '2026-04-18';
const CONTACT_EMAIL = 'contact@tibiatrader.com';

function PrivacyEN() {
  return (
    <>
      <Text style={styles.h1}>Privacy Policy</Text>
      <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>

      <Text style={styles.p}>
        {
          'TibiaTrader ("we", "us", the "Service") is a free tool that shows live Tibia in-game market prices, margins and optional local price alerts. We do not require an account and we do not collect personal data on our servers. This policy explains exactly what happens when you use the app or the website tibiatrader.com.'
        }
      </Text>

      <Text style={styles.h2}>1. Data we store on your device</Text>
      <Text style={styles.p}>
        {
          "The following values are saved in your browser's localStorage (web) or the app's local storage (mobile). They never leave your device and we cannot read them."
        }
      </Text>
      <Text style={styles.li}>• Selected Tibia world</Text>
      <Text style={styles.li}>• Favorite items per world</Text>
      <Text style={styles.li}>• Price-alert watchlist (item name, buy/sell thresholds)</Text>
      <Text style={styles.li}>• Alert-notification de-duplication state</Text>
      <Text style={styles.li}>• UI language (EN / PL)</Text>
      <Text style={styles.li}>• List/grid view preference (desktop)</Text>
      <Text style={styles.li}>• Favorite worlds (desktop sidebar)</Text>

      <Text style={styles.h2}>2. Data we do NOT collect</Text>
      <Text style={styles.li}>• No account, no email, no password</Text>
      <Text style={styles.li}>• No name, age, gender, phone number or physical address</Text>
      <Text style={styles.li}>• No Tibia character name or game login credentials</Text>
      <Text style={styles.li}>• No location, contacts, photos, files or device identifiers</Text>
      <Text style={styles.li}>• No advertising IDs, no cross-app tracking</Text>

      <Text style={styles.h2}>3. Third-party services</Text>
      <Text style={styles.p}>
        The Service calls the following third parties. They operate under their own privacy
        policies.
      </Text>
      <Text style={styles.liBold}>api.tibiamarket.top</Text>
      <Text style={styles.liSub}>
        Read-only market data (item prices, volumes, history). We proxy these requests through
        our own domain. The endpoint receives no personal data.
      </Text>
      <Text style={styles.liBold}>tibiadata.com</Text>
      <Text style={styles.liSub}>
        Public world list (name, PvP type, online count). Read-only, no personal data sent.
      </Text>
      <Text style={styles.liBold}>static.tibia.com</Text>
      <Text style={styles.liSub}>
        {"Item artwork images served directly from CipSoft's CDN. Standard HTTP headers only."}
      </Text>
      <Text style={styles.liBold}>Vercel Analytics &amp; Speed Insights (web only)</Text>
      <Text style={styles.liSub}>
        Anonymous page-view counts and Core Web Vitals measurements. No cookies, no fingerprint,
        no cross-site tracking. See vercel.com/docs/analytics/privacy-policy.
      </Text>

      <Text style={styles.h2}>4. Notifications (mobile app)</Text>
      <Text style={styles.p}>
        If you enable price alerts, the app requests permission to send local push notifications.
        Price comparisons happen on your device using the public market API. No alert content is
        sent to us or any third party.
      </Text>

      <Text style={styles.h2}>5. Children</Text>
      <Text style={styles.p}>
        The Service is suitable for users aged 13 and over. We do not knowingly collect personal
        data from anyone — this applies equally to minors.
      </Text>

      <Text style={styles.h2}>6. Your rights</Text>
      <Text style={styles.p}>
        {
          "Because we do not store personal data on our servers, there is nothing for us to disclose, correct or delete. You can clear the local data at any time by uninstalling the app or clearing your browser's site storage."
        }
      </Text>

      <Text style={styles.h2}>7. Not affiliated with CipSoft</Text>
      <Text style={styles.p}>
        {
          'TibiaTrader is a community-made fan tool. It is not affiliated with, endorsed by, or sponsored by CipSoft GmbH. "Tibia" is a trademark of CipSoft GmbH. All game assets (item names, artwork) remain the property of their respective owners.'
        }
      </Text>

      <Text style={styles.h2}>8. Changes to this policy</Text>
      <Text style={styles.p}>
        {
          'We may update this policy from time to time. Material changes will be reflected in the "Last updated" date above. Continued use of the Service after a change indicates acceptance.'
        }
      </Text>

      <Text style={styles.h2}>9. Contact</Text>
      <Text style={styles.p}>
        Questions or requests about this policy:{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
          {CONTACT_EMAIL}
        </Text>
        .
      </Text>
    </>
  );
}

function PrivacyPL() {
  return (
    <>
      <Text style={styles.h1}>Polityka prywatności</Text>
      <Text style={styles.meta}>Ostatnia aktualizacja: {LAST_UPDATED}</Text>

      <Text style={styles.p}>
        TibiaTrader („my”, „Serwis”) to darmowe narzędzie pokazujące aktualne ceny rynkowe
        przedmiotów w grze Tibia, marże oraz opcjonalne lokalne alerty cenowe. Nie wymagamy
        konta i nie zbieramy danych osobowych na naszych serwerach. Ten dokument wyjaśnia
        dokładnie, co się dzieje, gdy korzystasz z aplikacji lub strony tibiatrader.com.
      </Text>

      <Text style={styles.h2}>1. Dane przechowywane lokalnie na Twoim urządzeniu</Text>
      <Text style={styles.p}>
        Poniższe wartości zapisywane są w localStorage Twojej przeglądarki (wersja web) lub w
        lokalnej pamięci aplikacji (mobile). Nigdy nie opuszczają Twojego urządzenia — my nie
        mamy do nich dostępu.
      </Text>
      <Text style={styles.li}>• Wybrany świat Tibii</Text>
      <Text style={styles.li}>• Ulubione przedmioty per świat</Text>
      <Text style={styles.li}>• Lista alertów cenowych (nazwa przedmiotu, progi kupna/sprzedaży)</Text>
      <Text style={styles.li}>• Stan deduplikacji powiadomień o alertach</Text>
      <Text style={styles.li}>• Język interfejsu (EN / PL)</Text>
      <Text style={styles.li}>• Preferencja widoku listy/siatki (desktop)</Text>
      <Text style={styles.li}>• Ulubione światy (pasek boczny na desktopie)</Text>

      <Text style={styles.h2}>2. Dane, których NIE zbieramy</Text>
      <Text style={styles.li}>• Brak konta, brak e-maila, brak hasła</Text>
      <Text style={styles.li}>• Brak imienia, wieku, płci, numeru telefonu i adresu</Text>
      <Text style={styles.li}>• Brak nazwy postaci Tibii ani danych logowania do gry</Text>
      <Text style={styles.li}>
        • Brak lokalizacji, kontaktów, zdjęć, plików i identyfikatorów urządzenia
      </Text>
      <Text style={styles.li}>• Brak identyfikatorów reklamowych, brak cross-app trackingu</Text>

      <Text style={styles.h2}>3. Usługi zewnętrzne</Text>
      <Text style={styles.p}>
        Serwis łączy się z następującymi podmiotami trzecimi. Działają one na podstawie
        własnych polityk prywatności.
      </Text>
      <Text style={styles.liBold}>api.tibiamarket.top</Text>
      <Text style={styles.liSub}>
        Dane rynkowe tylko do odczytu (ceny przedmiotów, wolumeny, historia). Zapytania
        proxujemy przez własną domenę. Endpoint nie otrzymuje żadnych danych osobowych.
      </Text>
      <Text style={styles.liBold}>tibiadata.com</Text>
      <Text style={styles.liSub}>
        Publiczna lista światów (nazwa, typ PvP, liczba online). Tylko odczyt, żadne dane
        osobowe nie są wysyłane.
      </Text>
      <Text style={styles.liBold}>static.tibia.com</Text>
      <Text style={styles.liSub}>
        Grafiki przedmiotów pobierane bezpośrednio z CDN firmy CipSoft. Wyłącznie standardowe
        nagłówki HTTP.
      </Text>
      <Text style={styles.liBold}>Vercel Analytics i Speed Insights (tylko web)</Text>
      <Text style={styles.liSub}>
        Anonimowe liczby odsłon oraz pomiary Core Web Vitals. Brak ciasteczek, brak fingerprint,
        brak cross-site tracking. Zobacz vercel.com/docs/analytics/privacy-policy.
      </Text>

      <Text style={styles.h2}>4. Powiadomienia (aplikacja mobilna)</Text>
      <Text style={styles.p}>
        Po włączeniu alertów cenowych aplikacja prosi o zgodę na lokalne powiadomienia push.
        Porównania cen wykonywane są na Twoim urządzeniu za pomocą publicznego API rynku.
        Żadna treść alertu nie jest wysyłana do nas ani do podmiotów trzecich.
      </Text>

      <Text style={styles.h2}>5. Dzieci</Text>
      <Text style={styles.p}>
        Serwis przeznaczony jest dla osób w wieku 13+. Nie zbieramy świadomie danych osobowych
        od nikogo — dotyczy to również osób niepełnoletnich.
      </Text>

      <Text style={styles.h2}>6. Twoje prawa</Text>
      <Text style={styles.p}>
        Ponieważ nie przechowujemy danych osobowych na naszych serwerach, nie mamy niczego, co
        moglibyśmy udostępnić, sprostować ani usunąć. Dane lokalne możesz w każdej chwili
        wyczyścić odinstalowując aplikację lub czyszcząc pamięć strony w przeglądarce.
      </Text>

      <Text style={styles.h2}>7. Brak powiązań z CipSoft</Text>
      <Text style={styles.p}>
        TibiaTrader to narzędzie fanowskie tworzone przez społeczność. Nie jest powiązane z
        CipSoft GmbH, nie jest przez tę firmę sponsorowane ani firmowane. „Tibia” jest znakiem
        towarowym CipSoft GmbH. Wszystkie zasoby z gry (nazwy przedmiotów, grafiki) pozostają
        własnością ich właścicieli.
      </Text>

      <Text style={styles.h2}>8. Zmiany w polityce</Text>
      <Text style={styles.p}>
        Możemy aktualizować niniejszy dokument. Istotne zmiany będą odzwierciedlone w dacie
        „Ostatnia aktualizacja” powyżej. Dalsze korzystanie z Serwisu po zmianie oznacza jej
        akceptację.
      </Text>

      <Text style={styles.h2}>9. Kontakt</Text>
      <Text style={styles.p}>
        Pytania lub wnioski dotyczące polityki:{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
          {CONTACT_EMAIL}
        </Text>
        .
      </Text>
    </>
  );
}

export default function PrivacyScreen() {
  const { language } = useTranslation();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      <View style={styles.inner}>{language === 'pl' ? <PrivacyPL /> : <PrivacyEN />}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  inner: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  h1: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 20,
  },
  h2: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 8,
  },
  p: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  li: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
  },
  liBold: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 2,
  },
  liSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  link: {
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});
