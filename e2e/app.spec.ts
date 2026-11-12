import { expect, test } from '@playwright/test'

test.describe('Semantica in Gioco', () => {
  test('crea un profilo e avvia un modulo rispondendo con la tastiera', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Semantica in Gioco', level: 1 })).toBeVisible()

    const nickname = page.getByLabel(/Pseudonimo/)
    await nickname.fill('Gufo blu')
    await page.getByRole('button', { name: 'Crea e inizia' }).click()

    await expect(page.getByRole('heading', { name: 'Che cosa esploriamo oggi?' })).toBeVisible()

    // Apri il primo modulo e scegli il livello 1
    await page.getByRole('button', { name: /Inizia il modulo Parole e immagini/ }).click()
    await page.getByRole('button', { name: 'Inizia', exact: true }).click()

    // La consegna è visibile e la sessione registra il progresso
    await expect(page.getByRole('progressbar', { name: 'Avanzamento della sessione' })).toBeVisible()
    await expect(page.locator('.exercise__prompt')).toBeVisible()

    // Risposta con la tastiera: 1 seleziona la prima alternativa
    await page.keyboard.press('1')

    // Il feedback compare (corretto o da riprovare), mai un messaggio punitivo
    await expect(page.locator('.feedback')).toBeVisible()

    // Esci dalla sessione e torna al menu
    await page.getByRole('button', { name: 'Esci dalla sessione' }).click()
    await expect(page.getByRole('heading', { name: 'Che cosa esploriamo oggi?' })).toBeVisible()
  })

  test('la barra CAA è disponibile durante la sessione', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel(/Pseudonimo/).fill('Volpe verde')
    await page.getByRole('button', { name: 'Crea e inizia' }).click()
    await page.getByRole('button', { name: /Inizia il modulo Parole e immagini/ }).click()
    await page.getByRole('button', { name: 'Inizia', exact: true }).click()

    await page.getByRole('button', { name: 'Apri la barra dei simboli' }).click()
    await expect(page.getByRole('group', { name: 'Parole per comunicare' })).toBeVisible()
    await page.getByRole('button', { name: /^Voglio\./ }).click()
    await expect(page.locator('.caa-bar__phrase-text')).toContainText('Voglio')
  })

  test('l\'area adulti mostra la dashboard e i contenuti validati', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel(/Pseudonimo/).fill('Lupo rosso')
    await page.getByRole('button', { name: 'Crea e inizia' }).click()
    await page.getByRole('button', { name: 'Area adulti' }).first().click()
    await expect(page.getByRole('heading', { name: 'Insegnante, educatore, logopedista' })).toBeVisible()

    await page.getByRole('tab', { name: 'Progressi' }).click()
    // Con un profilo nuovo ma nessun tentativo la dashboard mostra lo stato vuoto.
    await expect(page.getByText('Nessun dato ancora')).toBeVisible()

    await page.getByRole('tab', { name: 'Dati e report' }).click()
    await expect(page.getByText('Qualità dei contenuti')).toBeVisible()
  })
})
