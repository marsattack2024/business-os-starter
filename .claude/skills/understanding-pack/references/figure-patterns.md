# Visual patterns

Use the smallest deterministic visual that exposes a relationship the prose
cannot communicate as quickly. The renderer owns all markup; JSON supplies only
escaped labels, details, states, commands, and links.

## Flow

Use when an event, request, lead, command, or artifact crosses boundaries.
Render connected nodes with visible directional connectors. Labels identify the
actor or stage; states identify what changes. If human intent matters, include
the model, client, human, and server as separate nodes rather than hiding them
inside a single “approval” step.

Do not use a flow for file import order or a list with no meaningful routing.

## Comparison

Use for current/proposed behavior, two policy choices, or two protocol shapes.
Render two aligned columns. Hold compared dimensions constant and name the
tradeoff. Avoid presenting the proposed side as automatically superior.

## State timeline

Use for reducers, jobs, approvals, migrations, retries, queues, or lifecycle
changes. Render an ordered line with distinct state markers. Selecting a state
may reveal its trigger, invariant, and consequence.

## Mapping

Use when inputs map to outputs, owners, scopes, capabilities, or source-of-truth
locations. Render exact left-to-right mappings, preferably as aligned rows.
Avoid paragraph-sized mapping items.

## Guided steps

Use for an opaque operation where stepping through the sequence builds
intuition. Render a vertical stepper with a clearly selected step, previous/next
controls, and one detail panel. The figure can display a command but cannot
execute it.

## Visual economy

- Decision brief: one or two visuals.
- Training pack: one to three visuals.
- Each visual should answer a named reader question.
- Reuse information from prose only as short labels; do not paste whole
  paragraphs into nodes.
- Use lines, spatial alignment, states, and boundaries before adding controls.
- Decorative animation and generated illustration are outside this skill.

If a visual could be replaced by three bullets without losing a relationship,
use the bullets.
