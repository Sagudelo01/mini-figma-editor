import { afterEach, describe, expect, it } from 'vitest'
import { applyTheme, getInitialTheme, THEME_KEY } from './theme'

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('theme', () => {
  it('defaults to dark when nothing is set', () => {
    expect(getInitialTheme()).toBe('dark')
  })

  it('applies a theme to the document and persists it', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(getInitialTheme()).toBe('light')
  })
})
