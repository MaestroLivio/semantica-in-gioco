import { describe, expect, it } from 'vitest'
import { applyPronunciation, normalizeForSpeech, numberToItalian } from './normalize-it'

describe('numberToItalian', () => {
  it('legge unità e decine irregolari', () => {
    expect(numberToItalian(0)).toBe('zero')
    expect(numberToItalian(17)).toBe('diciassette')
    expect(numberToItalian(21)).toBe('ventuno')
    expect(numberToItalian(23)).toBe('ventitré')
    expect(numberToItalian(28)).toBe('ventotto')
    expect(numberToItalian(48)).toBe('quarantotto')
  })

  it('legge centinaia, migliaia e milioni', () => {
    expect(numberToItalian(100)).toBe('cento')
    expect(numberToItalian(108)).toBe('cento otto')
    expect(numberToItalian(1000)).toBe('mille')
    expect(numberToItalian(2000)).toBe('duemila')
    expect(numberToItalian(1234)).toBe('mille duecento trentaquattro')
    expect(numberToItalian(1_000_000)).toBe('un milione')
  })
})

describe('normalizeForSpeech', () => {
  it('espande i numeri nel testo', () => {
    expect(normalizeForSpeech('Ci sono 21 mele')).toBe('Ci sono ventuno mele.')
  })

  it('legge i decimali e le migliaia', () => {
    expect(normalizeForSpeech('3,5')).toBe('tre virgola cinque.')
    expect(normalizeForSpeech('1.234')).toBe('mille duecento trentaquattro.')
  })

  it('legge unità di misura e simboli', () => {
    expect(normalizeForSpeech('5 kg')).toBe('cinque chili.')
    expect(normalizeForSpeech('5 m')).toBe('cinque metri.')
    expect(normalizeForSpeech('50%')).toBe('cinquanta per cento.')
  })

  it('scioglie le abbreviazioni frequenti', () => {
    expect(normalizeForSpeech('ecc.')).toBe('eccetera')
    expect(normalizeForSpeech('n. 3')).toBe('numero tre.')
  })

  it('rimuove i caratteri che non si pronunciano', () => {
    expect(normalizeForSpeech('Ciao 🐶')).toBe('Ciao')
  })

  it('disambigua gli omografi solo quando il contesto lo richiede', () => {
    expect(normalizeForSpeech('Andiamo a pesca domani')).toContain('pèsca')
    expect(normalizeForSpeech('La pesca è dolce')).toContain('pesca')
  })

  it('non modifica il testo mostrato al bambino', () => {
    const display = 'Ci sono 21 mele'
    normalizeForSpeech(display)
    expect(display).toBe('Ci sono 21 mele')
  })

  it('accetta un dizionario personalizzato', () => {
    const spoken = applyPronunciation('Il gatto beve il latte', [
      { word: 'latte', spoken: 'làtte' },
    ])
    expect(spoken).toBe('Il gatto beve il làtte')
  })

  it('gestisce stringhe vuote', () => {
    expect(normalizeForSpeech('')).toBe('')
    expect(normalizeForSpeech('   ')).toBe('')
  })
})
