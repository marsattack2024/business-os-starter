# Protocol approval source bundle

Audience: owner-operator who uses an AI connector and needs to approve one
protocol-alignment change. The owner does not need a general course on the
whole system.

## Observed current behavior

- `src/operations/authored-operation-families.ts:235` defines one
  authored capability registry. Agent tools and portal controls derive from it.
- The live compatibility lane serves today's released connector.
- `src/integrations/protocol/content-blocks.ts:114-124` builds confirmation
  messages used by both protocol lanes.
- `src/integrations/protocol/elicitation.ts:248` proves the live lane consumes
  that shared builder.
- `src/integrations/protocol/confirmation-challenge.ts:12-28` seals proposal,
  operation, tenant, grant, nonce, and expiry into request state.
- `src/integrations/protocol/elicitation.ts:93-175` unseals and verifies grant
  binding before ledger effects.

## Proposed behavior

- `docs/plans/protocol-rc-alignment.md` proposes separate
  compatibility and RC serializers.
- Compatibility output is intended to remain byte-for-byte unchanged.
- RC output should adopt the ratified result-level state and keyed request/response
  maps.
- Capability policy, parking, and execution logic should remain shared.

## Required decision evidence

1. RC fixtures match the ratified protocol exactly.
2. Compatibility golden tests prove today's output is unchanged.
3. The plan names a retirement condition for the temporary compatibility lane.

## Unresolved security boundary

The server sources prove token integrity, grant binding, expiry, and single use.
They do not prove that only a human can produce the approval answer or that the
model cannot invoke resolution. Treat client-enforced human intent as an open
question until client-side evidence proves confirmation is outside model
control and the resolution action is unavailable to the model.
