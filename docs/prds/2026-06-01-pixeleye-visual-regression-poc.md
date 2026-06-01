---
title: "Pixeleye Visual Regression Testing — Local PoC"
date: 2026-06-01
author: "Julien Schneider"
status: draft
---

# Pixeleye Visual Regression Testing — Local PoC

## Context

The DSP monorepo has 420 Storybook stories across 219 files, with existing `play()` functions for interaction testing. There is currently no visual regression testing in place — regressions in component appearance can go undetected until spotted manually.

Pixeleye is an open-source visual regression platform with a self-hosted Docker option and a proper approve/reject review UI, making it a strong candidate to fill this gap. Before committing to a team rollout or CI/CD integration, we need to validate that pixeleye works well with our Storybook setup and that the review workflow meets our needs.

## Goals

- Get pixeleye running locally via Docker Compose
- Connect the pixeleye CLI to the existing Storybook instance and capture baseline screenshots of all 420 stories
- Verify the review UI (approve/reject changed stories) works as expected
- Assess performance and screenshot quality at our story count
- Produce a written evaluation to inform the team rollout decision

## Core Features

1. **Local pixeleye instance** — Docker Compose stack (backend, frontend, DB, RabbitMQ, Ory Kratos) running on localhost
2. **Storybook integration** — `pixeleye storybook` CLI command pointed at the local Storybook dev server, capturing all stories
3. **Baseline capture** — Initial full snapshot of all 420 stories stored in the local pixeleye instance
4. **Change detection** — Modify one or more components, re-run capture, verify diffs appear correctly in the review UI
5. **Evaluation notes** — Document findings: setup friction, screenshot quality, review UX, performance, limitations

## Constraints

- Local only — no shared server, no external access
- Default Docker Compose config is sufficient (no security hardening needed for local PoC)
- Must work with the existing Storybook setup without modifying story files
- pixeleye project token comes from the local instance dashboard (no cloud account needed)

## Out of Scope

- CI/CD integration (GitHub Actions)
- GitHub App / PR status checks
- Shared team server or cloud deployment
- Security hardening of Docker config
- Migrating from Cypress to Playwright (separate initiative)
- Cross-browser or responsive testing variants (evaluate in a follow-up if PoC succeeds)

## Next Steps

- [ ] Pull pixeleye Docker Compose files from the [pixeleye GitHub repo](https://github.com/pixeleye-io/pixeleye)
- [ ] Run `docker compose -f docker-compose-self-hosting.yml up` and access dashboard at `http://localhost:3000`
- [ ] Create a project in the dashboard and retrieve the project token
- [ ] Install pixeleye CLI: `npm install pixeleye --save-dev`
- [ ] Add `pixeleye.config.ts` to project root with token and Storybook URL
- [ ] Run baseline capture: `pixeleye storybook http://localhost:6006`
- [ ] Introduce a visual change to a component and re-run to verify diff detection
- [ ] Write up evaluation findings and share with team
