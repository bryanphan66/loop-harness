import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * UNIVERSAL fidelity checklist -- the U1-U4 + i18n + responsive + a11y +
 * data-state + opaque-sticky-header invariants every admin screen must hold
 * (a screen with a scrolling table that does not call
 * expectStickyHeaderOpaque is a coverage gap), defined ONCE and
 * imported by every `*-fidelity.spec.ts` (enforced by
 * scripts/check-universal-fidelity-imports.mjs, wired into `validate`).
 * A new screen gets the whole checklist by calling these helpers instead of
 * re-inlining assertions; skipping the import is RED at validate time.
 */

/** "rgb(10, 20, 15)" | "rgba(10, 20, 15, 1)" -> [10, 20, 15] */
export function rgbTriple(css: string): number[] {
  return (css.match(/\d+/g) ?? []).slice(0, 3).map(Number);
}

export const MOBILE_VIEWPORT = { width: 375, height: 812 };

/**
 * U1 -- the portal chrome is the real kit.jsx AdminShell: full multi-section
 * sidebar + the topbar control strip (search, help, theme toggle, VI/EN
 * group, bell, user chip). Call on any page rendered inside AdminShell.
 */
export async function expectAppShell(page: Page): Promise<void> {
  const sidebar = page.locator('aside.shell-sidebar');
  await expect(sidebar).toBeVisible();
  for (const section of ['Đào tạo', 'Người dùng', 'Kinh doanh', 'Marketing', 'Phân tích', 'Hệ thống']) {
    await expect(sidebar.locator('.nav-section-label', { hasText: section })).toBeVisible();
  }
  const topbar = page.locator('header.shell-topbar');
  await expect(topbar.locator('.topbar-search')).toBeVisible();
  await expect(topbar.getByRole('button', { name: /giao diện sáng \/ tối/ })).toBeVisible();
  await expect(topbar.getByRole('group', { name: /Ngôn ngữ/ })).toBeVisible();
  await expect(topbar.getByRole('button', { name: 'Thông báo' })).toBeVisible();
  await expect(topbar.locator('.user-chip')).toBeVisible();
}

/**
 * U2 -- no focus steal: one continuous keyboard burst into `selector` lands
 * intact and the field keeps focus (a keystroke-triggered re-render that
 * remounts the input turns this red).
 */
export async function expectNoFocusSteal(page: Page, selector: string, text = 'Trưởng nhóm đào tạo khu vực miền Nam'): Promise<void> {
  const field = page.locator(selector);
  await field.click();
  await page.keyboard.type(text, { delay: 10 });
  await expect(field).toHaveValue(text);
  await expect(field).toBeFocused();
}

/**
 * U3 -- both themes really apply the export tokens: content background equals
 * the token value in light AND dark, and the chrome keeps the brand identity
 * in dark mode (sidebar gradient stack does not flatten). Leaves the page
 * back in light mode.
 */
export async function expectBothThemes(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: /giao diện sáng \/ tối/ });
  const main = page.locator('main.shell-main');
  // The CURRENTLY-resolved --background token, painted through a probe node
  // so browser hsl->rgb rounding matches exactly.
  const tokenBackground = () =>
    page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.background = 'hsl(var(--background))';
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });

  // Light: the content region paints the export token, not a hardcoded color.
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  const lightBg = await main.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(lightBg).toBe(await tokenBackground());

  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  // Dark: token painted AND pinned to the export value
  // (tokens.css .dark --background: 150 32% 6% -> rgb(10, 20, 15)).
  const darkBg = await main.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(darkBg).toBe(await tokenBackground());
  expect(rgbTriple(darkBg)).toEqual([10, 20, 15]);
  expect(darkBg).not.toBe(lightBg);
  // Chrome keeps the brand forest-green gradient sidebar in dark mode.
  const sidebarImage = await page.locator('aside.shell-sidebar').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(sidebarImage).toContain('linear-gradient');

  await toggle.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
}

/**
 * U4 -- the shell stays put: page content scrolls in its own region while the
 * document itself has nothing to scroll and the sidebar nav never leaves the
 * viewport. `scrollRegion` is the screen's overflow container.
 */
export async function expectShellStaysPut(page: Page, scrollRegion: string): Promise<void> {
  const firstNav = page.locator('aside.shell-sidebar .nav-item').first();
  await expect(firstNav).toBeVisible();
  await page.locator(scrollRegion).evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const docOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(docOverflow, 'document must not scroll — the shell owns the viewport').toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(firstNav).toBeInViewport();
}

/** No horizontal page scroll at the current viewport. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, 'page must not scroll horizontally').toBeLessThanOrEqual(innerWidth);
}

export interface I18nResponsiveOptions {
  /** Narrowest supported viewport width (NFR.UX.01). */
  minWidth?: number;
  /** A string visible in VI whose EN translation differs — proves the toggle rewires copy. */
  viText: string;
  enText: string;
  /** CSS selectors of tap targets that must be >=44px on mobile. */
  tapTargets?: string[];
}

/**
 * i18n + responsive floor: the VI/EN toggle really swaps visible copy
 * (NFR.I18N.01), and at `minWidth` (default 375) the page has no horizontal
 * scroll and the given tap targets are >=44px (NFR.UX.01). Restores the
 * original viewport + VI locale before returning.
 */
export async function expectI18nAndResponsive(page: Page, opts: I18nResponsiveOptions): Promise<void> {
  const { minWidth = 375, viText, enText, tapTargets = [] } = opts;

  await expect(page.getByText(viText).first()).toBeVisible();
  await page.locator('.lang-switch').first().getByRole('button', { name: 'EN' }).click();
  await expect(page.getByText(enText).first()).toBeVisible();
  await page.locator('.lang-switch').first().getByRole('button', { name: 'VI' }).click();
  await expect(page.getByText(viText).first()).toBeVisible();

  const original = page.viewportSize();
  await page.setViewportSize({ width: minWidth, height: MOBILE_VIEWPORT.height });
  await expectNoHorizontalScroll(page);
  for (const selector of tapTargets) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `${selector} bounding box`).not.toBeNull();
    expect(box!.width, `${selector} tap width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${selector} tap height`).toBeGreaterThanOrEqual(44);
  }
  if (original) await page.setViewportSize(original);
}

export interface DataStateOptions {
  /** Navigate with the data request HELD PENDING so the loading state shows. */
  enterLoading: () => Promise<void>;
  /** Navigate with the data request failing so the error state shows. */
  enterError: () => Promise<void>;
  /** Navigate with the data request returning zero rows (omit if the screen has no empty concept). */
  enterEmpty?: () => Promise<void>;
}

/**
 * Every data screen renders the shared DataState primitives
 * (components/ui/data-state.tsx) for its non-happy paths -- skeleton while
 * loading, `.error-state` with a retry CTA on failure, `.empty-state` on zero
 * rows -- never a bare <p> or ad-hoc alert.
 */
export async function expectLoadingEmptyError(page: Page, opts: DataStateOptions): Promise<void> {
  await opts.enterLoading();
  await expect(page.locator('.skeleton').first()).toBeVisible();

  await opts.enterError();
  await expect(page.locator('.error-state')).toBeVisible();
  await expect(page.locator('.error-state .btn')).toBeVisible();

  if (opts.enterEmpty) {
    await opts.enterEmpty();
    await expect(page.locator('.empty-state')).toBeVisible();
  }
}

/**
 * Sticky table headers are OPAQUE — a machine assertion for the bleed-through
 * class of bug: a `position: sticky` thead with a translucent background lets
 * rows show THROUGH the header while scrolling. Every data screen with a
 * scrolling table (`.data-region .tbl`, `.matrix`) must call this. It asserts
 * the header cell really is sticky, its computed background-color has alpha
 * == 1 (not `transparent`, not `rgba(…, <1)`), and after scrolling the region
 * the header is still pinned to the container top (rows slid underneath, not
 * over it). Restores scrollTop before returning.
 */
export async function expectStickyHeaderOpaque(
  page: Page,
  scrollContainerSelector = '.data-region > .tbl-wrap',
): Promise<void> {
  const container = page.locator(scrollContainerSelector).first();
  await expect(container).toBeVisible();
  const header = container.locator('thead th').first();
  await expect(header).toBeVisible();

  // EVERY header cell must be sticky AND paint a fully-opaque background —
  // checking only the first th would miss a translucent sibling (e.g. the
  // matrix corner cell is opaque while the role columns were not). Opacity is
  // judged by painting the computed color once onto a transparent 1x1 canvas
  // and reading the pixel's alpha byte (255 ⟺ alpha 1) — robust to every
  // computed serialization: rgb()/rgba()/color(srgb …)/color-mix results.
  const cells = await container.locator('thead th').evaluateAll((els) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    return els.map((el) => {
      const style = getComputedStyle(el);
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      return {
        position: style.position,
        backgroundColor: style.backgroundColor,
        opaque: ctx.getImageData(0, 0, 1, 1).data[3] === 255,
        text: el.textContent?.trim() ?? '',
      };
    });
  });
  expect(cells.length, `thead th cells in ${scrollContainerSelector}`).toBeGreaterThan(0);
  for (const cell of cells) {
    expect(cell.position, `thead th "${cell.text}" in ${scrollContainerSelector} must be sticky`).toBe('sticky');
    expect(
      cell.opaque,
      `sticky header "${cell.text}" background must be fully opaque, got "${cell.backgroundColor}"`,
    ).toBe(true);
  }

  // Scroll the region: the header must stay pinned at the container's top edge
  // with the rows passing underneath it.
  await container.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const containerBox = await container.boundingBox();
  const headerBox = await header.boundingBox();
  expect(containerBox, `${scrollContainerSelector} bounding box`).not.toBeNull();
  expect(headerBox, 'sticky header bounding box').not.toBeNull();
  expect(
    Math.abs(headerBox!.y - containerBox!.y),
    'sticky header must stay pinned to the scroll container top',
  ).toBeLessThanOrEqual(2);
  await container.evaluate((el) => {
    el.scrollTop = 0;
  });
}

/**
 * a11y floor as a MACHINE assertion: axe-core scan of the current page must
 * report ZERO serious/critical violations (WCAG 2.x A/AA rule set).
 */
export async function expectA11yFloor(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    blocking.map((v) => `${v.impact}: ${v.id} — ${v.help} (${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target})`),
    'axe-core serious/critical violations',
  ).toEqual([]);
}
