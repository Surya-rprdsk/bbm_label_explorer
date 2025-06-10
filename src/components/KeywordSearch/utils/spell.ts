import nspell from 'nspell';
// @ts-ignore
import enAff from '../../../assets/dictionaries/en_US.aff?raw';
// @ts-ignore
import enDic from '../../../assets/dictionaries/en_US.dic?raw';

let spellEn: nspell | null = null;

export function getSpell(lang: 'en' | 'de' = 'en') {
  if (lang === 'en') {
    if (!spellEn) {
      spellEn = nspell(enAff, enDic);
    }
    return spellEn;
  }
  // TODO: Add German dictionary support
  return null;
}

export function correctWords(words: string[], lang: 'en' | 'de'): string[] {
  const spell = getSpell(lang);
  if (!spell) return words;
  return words.map(word => {
    if (!spell.correct(word)) {
      const suggestions = spell.suggest(word);
      if (suggestions && suggestions.length > 0) {
        return suggestions[0];
      }
    }
    return word;
  });
}
