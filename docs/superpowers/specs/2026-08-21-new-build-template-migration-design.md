# New-build website template migration

## Goal

Replace the starter's simplified `site/` application with the current merged
`agencyOS/templates/new-build` website template, while retaining the Business
OS root and all of its private operating records.

## Source and destination

- Source: `/Users/humbertogarcia/Downloads/P2P/000. agencyOS/templates/new-build`
  at the current local `main` revision (`0b93cbb3`).
- Destination: `/Users/humbertogarcia/Downloads/P2P/003. business-os-starter/site`.

## Migration boundary

The transfer replaces the contents of `site/` only. The following stay in the
starter repository and must never be incorporated into a public deployment:

- `context/`
- root `content/`
- `work/`
- `inbox/`
- `connections/`
- root configuration, scripts, and Git history

The source template's own public-site code, configuration, tests, and
documentation transfer as a single compatible unit. No source client data,
credentials, local environment files, or source Git metadata transfer.

## Verification and rollback

Before the transfer, record the starter's current Git revision. After the
transfer, install the template dependencies and run its typecheck, tests, and
template verification. Inspect the starter's public-build boundary again
before any future deployment. If verification fails or the new template is
not appropriate, restore `site/` from the recorded pre-migration revision.
