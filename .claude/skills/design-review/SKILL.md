---
name: design-review
description: Review a web app or page for visual design quality — layout, typography, spacing, colour, hierarchy, consistency, interaction patterns, and responsive behaviour. Use when the user asks to review, audit, or sign off on the UI/UX of an existing site or page, especially before a demo, deploy, or client handoff. This is a visual-polish audit, not a UX/usability/workflow audit — pair it with ui-ux-pro-max for interaction/accessibility rules and with actual functional testing for usability.
---

# Design Review

Adapted from the design-review skill in jezweb/claude-skills (`plugins/frontend/skills/design-review`), condensed for local use in this project.

## Purpose

Assess whether an interface looks **professional and polished** — the question a design-conscious person would ask on seeing it for the first time — across seven dimensions. This complements `ui-ux-pro-max` (which supplies the specific rule checklist for accessibility/interaction/responsive/etc.) by giving a structured way to *report* findings with severity and evidence, rather than a loose list of impressions.

## The Seven Dimensions

1. **Layout & spacing** — consistent spacing scale and generous whitespace vs. random spacing and cramped elements.
2. **Typography** — hierarchy, line length (50–75 characters optimal for body text), line-height ratio, font-size consistency across similar elements.
3. **Colour & contrast** — semantic colour usage (tokens, not ad-hoc hex per component), WCAG contrast compliance, dark-mode viability (not just inverted colours).
4. **Visual hierarchy** — is the primary action/content obvious at a glance, or does everything compete for attention equally?
5. **Component consistency** — do buttons, cards, inputs, icons, and shadows look like they belong to the same design system, or do variants drift across pages?
6. **Interaction design** — hover/focus/active/disabled states present and visually distinct; loading and empty states designed, not default/blank.
7. **Responsive quality** — does the layout actually adapt (reflow, resize, reorder) at real breakpoints, or does it just shrink/overflow?

## Workflow

1. Capture the page(s) under review as screenshots at the breakpoints in scope (this project: 375×667, 768×1024, 1440×900 at minimum; both LTR and RTL where the site supports both languages).
2. Walk each of the seven dimensions against each screenshot. For an Arabic/RTL-first site, explicitly check: does spacing/alignment/icon-direction mirror correctly, or does the layout just look like the LTR version with text flipped?
3. Classify every real finding:
   - **High** — makes the design look broken (invisible/low-contrast text, misaligned or overlapping elements, content cut off, a control that doesn't look interactive).
   - **Medium** — polish problems (inconsistent spacing rhythm, truncation without affordance, mismatched border-radius/shadow across similar components).
   - **Low** — minor detail (slight alignment variance, a shadow that's a shade too dark).
4. For every finding, record: page, breakpoint, screenshot evidence, severity, and a concrete fix (not just "this looks off").
5. Explicitly note what's **already working well** — a review that only lists problems is less useful than one that also tells you what not to touch.
6. Triage before fixing anything: only High and clearly-justified Medium findings get fixed in a bug-repair pass; Low findings and genuine "different designer would choose differently" opinions get logged, not acted on, unless the user asks for a deeper redesign pass.

## Output

A findings list (or a section of the project's existing readiness report) with: dimension, severity, page/breakpoint, evidence, and fix — plus a short "what's already good" note. Do not produce vague statements like "the design feels a bit generic" without pointing at the specific element and dimension that causes that impression.
