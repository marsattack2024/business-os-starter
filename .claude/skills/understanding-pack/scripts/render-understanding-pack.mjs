#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  escapeHtml as h,
  loadPack,
  parseCliArgs,
  validateUnderstandingPack
} from "./understanding-pack-lib.mjs";

export function renderUnderstandingPack(pack) {
  const errors = validateUnderstandingPack(pack);
  if (errors.length > 0) throw new Error(`Cannot render invalid pack:\n- ${errors.join("\n- ")}`);

  const sourceNumbers = new Map(pack.sourceScope.sources.map((source, index) => [source.id, index + 1]));
  const cite = (sourceIds) => `<span class="citations" aria-label="Sources">${sourceIds.map((id) =>
    `<a class="citation" href="#source-${h(id)}" aria-label="Source ${sourceNumbers.get(id)}">${sourceNumbers.get(id)}</a>`
  ).join("")}</span>`;
  const visuals = pack.visuals.map((visual) => renderVisual(visual, cite)).join("");
  const mainContent = pack.profile === "decision-brief"
    ? renderDecisionBrief(pack, cite, visuals)
    : renderTrainingPack(pack, cite, visuals);
  const navItems = pack.profile === "decision-brief"
    ? [["decision", "Decision"], ["change", "Today vs proposed"], ["visuals", "Visuals"], ["evidence", "Approval evidence"], ["risks", "Risks"], ["sources", "Sources"]]
    : [["foundation", "Foundation"], ["visuals", "Visuals"], ["walkthrough", "Walkthrough"], ["edges", "Edges"], ...(pack.trainingPack.quiz ? [["quiz", "Practice"]] : []), ["sources", "Sources"]];
  const sources = pack.sourceScope.sources.map((source, index) => `
    <li id="source-${h(source.id)}">
      <span class="source-number">${index + 1}</span>
      <div><strong>${h(source.label)}</strong><code>${h(source.locator)}${source.lines ? `:${h(source.lines)}` : ""}</code><p>${h(source.evidence)}</p></div>
    </li>`).join("");
  const limitations = pack.limitations.length > 0
    ? `<div class="limitations"><h3>Limitations</h3><ul>${pack.limitations.map((entry) => `<li>${h(entry)}</li>`).join("")}</ul></div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <link rel="icon" href="data:,">
  <title>${h(pack.title)}</title>
  <style>${styles()}</style>
</head>
<body data-profile="${h(pack.profile)}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="hero"><div class="shell">
    <p class="overline">${h(pack.profile === "decision-brief" ? "Decision brief" : "Training pack")} · ${h(pack.mode)}</p>
    <h1>${h(pack.title)}</h1>
    <p class="subtitle">${h(pack.subtitle)}</p>
    <dl class="hero-meta">
      <div><dt>Reader</dt><dd>${h(pack.audience.role)}</dd></div>
      <div><dt>Next job</dt><dd>${h(pack.audience.participationGoal)}</dd></div>
      <div><dt>Evidence</dt><dd>${h(pack.sourceScope.revision)}</dd></div>
    </dl>
  </div></header>
  <nav class="section-nav" aria-label="Artifact sections"><div class="shell">${navItems.map(([id, label]) => `<a href="#${id}">${label}</a>`).join("")}</div></nav>
  <main id="main" class="shell">${mainContent}
    <section id="sources" class="sources-section">
      <div class="section-heading"><p class="overline">Traceable evidence</p><h2>Sources</h2><p>${h(pack.sourceScope.summary)}</p></div>
      <ol class="source-list">${sources}</ol>${limitations}
    </section>
  </main>
  <footer class="shell footer-note">Generated from a validated Business OS understanding-pack v2 document. No network requests, analytics, or stored quiz results.</footer>
  <script>${clientScript()}</script>
</body>
</html>`;
}

function renderDecisionBrief(pack, cite, visuals) {
  const brief = pack.decisionBrief;
  const current = brief.currentState.map((claim) => renderClaim(claim, cite)).join("");
  const proposed = brief.proposedChange.map((claim) => renderClaim(claim, cite)).join("");
  const criteria = brief.approvalCriteria.map((entry, index) => `
    <li><span class="criterion-index">${index + 1}</span><div><div class="criterion-head"><strong>${h(entry.criterion)}</strong><span class="status status-${h(entry.status)}">${h(entry.status)}</span></div><p>${h(entry.evidenceRequired)} ${cite(entry.sourceIds)}</p></div></li>`).join("");
  const risks = brief.risks.map((entry) => `
    <article class="risk-row"><div><p class="risk-label">Risk</p><h3>${h(entry.risk)}</h3></div><div><p><strong>Impact</strong><br>${h(entry.impact)}</p><p><strong>Mitigation</strong><br>${h(entry.mitigation)} ${cite(entry.sourceIds)}</p></div></article>`).join("");
  const questions = brief.openQuestions.length > 0 ? `
    <div class="open-questions"><h3>Unresolved questions</h3>${brief.openQuestions.map((entry) => `<details><summary>${h(entry.question)}</summary><p>${h(entry.whyItMatters)} ${cite(entry.sourceIds)}</p></details>`).join("")}</div>` : "";
  return `
    <section id="decision" class="decision-lead">
      <p class="decision-question">${h(brief.question)}</p>
      <div class="recommendation"><span>Recommendation</span><strong>${h(brief.recommendation)}</strong></div>
      <div class="rationale"><h2>${h(brief.rationale.title)}</h2><p>${h(brief.rationale.body)} ${cite(brief.rationale.sourceIds)}</p></div>
    </section>
    <section id="change">
      <div class="section-heading"><p class="overline">Keep the lanes separate</p><h2>Today versus proposed</h2></div>
      <div class="change-columns"><div><h3>What exists today</h3>${current}</div><div><h3>What this change proposes</h3>${proposed}</div></div>
    </section>
    <section id="visuals"><div class="section-heading"><p class="overline">See the decisive relationship</p><h2>Visual model</h2></div>${visuals}</section>
    <section id="evidence">
      <div class="section-heading"><p class="overline">Conditions, not ceremony</p><h2>Evidence required before approval</h2></div>
      <ol class="criteria-list">${criteria}</ol>
    </section>
    <section id="risks"><div class="section-heading"><p class="overline">What could still be wrong</p><h2>Risks and open questions</h2></div>${risks}${questions}</section>`;
}

function renderTrainingPack(pack, cite, visuals) {
  const training = pack.trainingPack;
  const background = training.background.map((claim) => renderClaim(claim, cite)).join("");
  const objectives = training.learningObjectives.map((objective) => `<li>${h(objective)}</li>`).join("");
  const walkthrough = [...training.walkthrough].sort((a, b) => a.sequence - b.sequence).map((step) => {
    const code = step.code !== undefined ? `<pre><code data-language="${h(step.language || "text")}">${h(step.code)}</code></pre>` : "";
    const checkpoints = step.checkpoints.length > 0 ? `<ul class="checkpoints">${step.checkpoints.map((item) => `<li>${h(item)}</li>`).join("")}</ul>` : "";
    return `<article id="walkthrough-${h(step.id)}" class="walkthrough-step"><span class="step-number">${step.sequence}</span><div><p class="step-why">${h(step.whyNow)}</p><h3>${h(step.title)}</h3><p class="location">${h(step.location)}</p><p>${h(step.explanation)} ${cite([step.sourceId])}</p>${code}<p class="consequence"><strong>Consequence</strong>${h(step.consequence)}</p>${checkpoints}</div></article>`;
  }).join("");
  const edges = training.edgeCases.map((edge) => `<article class="edge-row"><h3>${h(edge.scenario)}</h3><p><strong>Behavior</strong>${h(edge.behavior)}</p><p><strong>Why</strong>${h(edge.why)} ${cite(edge.sourceIds)}</p></article>`).join("");
  const prompts = training.discussionPrompts.length > 0 ? `<div class="discussion"><h3>Questions to discuss</h3>${training.discussionPrompts.map((entry) => `<details><summary>${h(entry.prompt)}</summary><p>${h(entry.why)}</p></details>`).join("")}</div>` : "";
  const quiz = training.quiz ? renderQuiz(training.quiz, cite) : "";
  return `
    <section id="foundation">
      <div class="section-heading"><p class="overline">Mental model</p><h2>Foundation</h2></div>
      <div class="foundation-grid"><div><h3>After this, you can</h3><ul class="objective-list">${objectives}</ul></div><div class="background-list">${background}</div></div>
      <div class="intuition"><div><span>Essential mechanism</span><strong>${h(training.intuition.essence)}</strong> ${cite(training.intuition.sourceIds)}</div><dl><div><dt>Input</dt><dd>${h(training.intuition.example.input)}</dd></div><div><dt>Result</dt><dd>${h(training.intuition.example.result)}</dd></div><div><dt>Why</dt><dd>${h(training.intuition.example.why)}</dd></div></dl></div>
    </section>
    <section id="visuals"><div class="section-heading"><p class="overline">Relationships made visible</p><h2>Visual model</h2></div>${visuals}</section>
    <section id="walkthrough"><div class="section-heading"><p class="overline">Follow cause and effect</p><h2>Walkthrough</h2></div><div class="walkthrough-list">${walkthrough}</div></section>
    <section id="edges"><div class="section-heading"><p class="overline">Where the model bends</p><h2>Edges and limits</h2></div><div class="edge-list">${edges}</div>${prompts}</section>${quiz}`;
}

function renderClaim(claim, cite) {
  return `<article class="claim"><span class="claim-status">${h(claim.status)}</span><h4>${h(claim.title)}</h4><p>${h(claim.body)} ${cite(claim.sourceIds)}</p></article>`;
}

function renderVisual(visual, cite) {
  const header = `<header class="visual-header"><div><p class="visual-kind">${h(visual.kind)}</p><h3>${h(visual.title)}</h3><p>${h(visual.teachingGoal)} ${cite(visual.sourceIds)}</p></div></header>`;
  if (visual.kind === "comparison") {
    const sides = visual.items.map((item, index) => `<article class="comparison-side"><span>${index === 0 ? "A" : "B"}</span><h4>${h(item.label)}</h4>${item.state ? `<strong>${h(item.state)}</strong>` : ""}<p>${h(item.detail)}</p></article>`).join("");
    return `<article id="visual-${h(visual.id)}" class="visual visual-comparison" data-visual="${h(visual.id)}">${header}<div class="comparison-grid">${sides}</div></article>`;
  }
  if (visual.kind === "mapping") {
    const rows = visual.items.map((item) => `<div class="mapping-row"><strong>${h(item.label)}</strong><span class="mapping-arrow" aria-hidden="true">→</span><div>${item.state ? `<span>${h(item.state)}</span>` : ""}<p>${h(item.detail)}</p></div></div>`).join("");
    return `<article id="visual-${h(visual.id)}" class="visual visual-mapping" data-visual="${h(visual.id)}">${header}<div class="mapping-table">${rows}</div></article>`;
  }
  if (visual.kind === "flow") {
    const links = new Map(visual.links.map((link) => [`${link.from}:${link.to}`, link]));
    const nodes = visual.items.map((item, index) => {
      const next = visual.items[index + 1];
      const link = next ? links.get(`${item.id}:${next.id}`) : null;
      const connector = next ? `<div class="flow-connector"><span>${h(link?.label || "")}</span><b aria-hidden="true">→</b></div>` : "";
      return `<button type="button" class="flow-node visual-control" data-visual-control data-target="${h(item.id)}" aria-pressed="${index === 0}"><span>${index + 1}</span><strong>${h(item.label)}</strong>${item.state ? `<small>${h(item.state)}</small>` : ""}</button>${connector}`;
    }).join("");
    return `<article id="visual-${h(visual.id)}" class="visual visual-flow" data-visual="${h(visual.id)}">${header}<div class="flow-canvas">${nodes}</div>${renderVisualPanels(visual)}</article>`;
  }
  if (visual.kind === "state-timeline") {
    const nodes = visual.items.map((item, index) => `<button type="button" class="timeline-node visual-control" data-visual-control data-target="${h(item.id)}" aria-pressed="${index === 0}"><span>${index + 1}</span><strong>${h(item.label)}</strong>${item.state ? `<small>${h(item.state)}</small>` : ""}</button>`).join("");
    return `<article id="visual-${h(visual.id)}" class="visual visual-timeline" data-visual="${h(visual.id)}">${header}<div class="timeline-track">${nodes}</div>${renderVisualPanels(visual)}</article>`;
  }
  const steps = visual.items.map((item, index) => `<button type="button" class="guided-step visual-control" data-visual-control data-target="${h(item.id)}" aria-pressed="${index === 0}"><span>${index + 1}</span><strong>${h(item.label)}</strong>${item.state ? `<small>${h(item.state)}</small>` : ""}</button>`).join("");
  return `<article id="visual-${h(visual.id)}" class="visual visual-guided" data-visual="${h(visual.id)}">${header}<div class="guided-layout"><div class="guided-steps">${steps}</div><div>${renderVisualPanels(visual)}<div class="guided-actions"><button type="button" data-visual-prev>Previous</button><button type="button" data-visual-next>Next</button></div></div></div></article>`;
}

function renderVisualPanels(visual) {
  return `<div class="visual-panels">${visual.items.map((item, index) => `<div class="visual-panel" data-visual-panel="${h(item.id)}"${index === 0 ? "" : " hidden"}><p class="panel-state">${item.state ? h(item.state) : "Selected detail"}</p><h4>${h(item.label)}</h4><p>${h(item.detail)}</p>${item.command ? `<code>${h(item.command)}</code>` : ""}</div>`).join("")}</div>`;
}

function renderQuiz(quiz, cite) {
  const questions = quiz.questions.map((question, questionIndex) => `
    <fieldset class="quiz-question" data-question="${h(question.id)}" data-correct="${question.correctIndex}">
      <legend><span>${questionIndex + 1}</span>${h(question.prompt)}</legend>
      <div class="quiz-options">${question.options.map((option, optionIndex) => `
        <label class="quiz-option"><input type="radio" name="${h(question.id)}" value="${optionIndex}"><span class="option-letter">${String.fromCharCode(65 + optionIndex)}</span><span>${h(option.label)}</span></label>
        <p class="rationale" data-option="${optionIndex}" hidden>${h(option.rationale)}</p>`).join("")}</div>
      <a class="review-link" href="${reviewTargetHref(question.reviewTarget)}" hidden>Review the supporting passage</a>${cite(question.sourceIds)}
    </fieldset>`).join("");
  return `<section id="quiz"><div class="section-heading"><p class="overline">Retrieval practice</p><h2>Check your model</h2><p>${h(quiz.instructions)}</p></div><form id="quiz-form">${questions}<div class="quiz-actions"><button class="primary-button" type="submit" disabled>Check answers</button><button class="secondary-button" type="reset">Reset</button><output id="quiz-result" aria-live="polite"></output></div></form></section>`;
}

function reviewTargetHref(target) {
  if (target === "foundation" || target === "edges") return `#${target}`;
  const [kind, id] = target.split(":");
  return kind === "visual" ? `#visual-${h(id)}` : `#walkthrough-${h(id)}`;
}

function styles() {
  return `
    :root{--ink:#18211d;--muted:#5e6863;--paper:#f4f0e6;--panel:#fffdf7;--line:#d5d0c3;--forest:#155f46;--forest-soft:#dcebe2;--blue:#315d72;--blue-soft:#dce8ed;--amber:#9b5c12;--amber-soft:#f3e5c9;--red:#8b3d32;--red-soft:#f0dcd7;--shadow:0 18px 55px rgba(31,39,34,.08);font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}[hidden]{display:none!important}html{scroll-behavior:smooth;scroll-padding-top:76px}body{margin:0;background:linear-gradient(180deg,#eef3ec 0,transparent 34rem),var(--paper);line-height:1.62}button,input{font:inherit}button{color:inherit}a{color:var(--forest)}code,pre{font-family:"SFMono-Regular",Consolas,monospace}.shell{width:min(1080px,calc(100% - 36px));margin-inline:auto}.skip-link{position:absolute;left:-9999px;top:10px}.skip-link:focus{left:10px;z-index:100;background:white;padding:10px}.hero{padding:74px 0 46px;border-bottom:1px solid var(--line)}.overline,.visual-kind,.risk-label,.step-why{margin:0 0 8px;color:var(--forest);font-size:.76rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-family:Georgia,serif;font-size:clamp(2.7rem,6.5vw,5.6rem);line-height:.98;max-width:940px;margin:20px 0;letter-spacing:-.045em}.subtitle{max-width:780px;font-size:clamp(1.08rem,2vw,1.35rem);color:var(--muted)}.hero-meta{display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:30px;margin:42px 0 0;padding-top:22px;border-top:1px solid var(--line)}.hero-meta div{min-width:0}.hero-meta dt{color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}.hero-meta dd{margin:5px 0 0;font-weight:650;overflow-wrap:anywhere}.section-nav{position:sticky;top:0;z-index:20;background:rgba(244,240,230,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}.section-nav .shell{display:flex;flex-wrap:wrap;gap:4px 24px;padding-block:11px}.section-nav a{text-decoration:none;color:var(--muted);font-size:.88rem;font-weight:700;border-bottom:2px solid transparent}.section-nav a:hover,.section-nav a:focus-visible,.section-nav a[aria-current="true"]{color:var(--forest);border-color:var(--forest);outline:none}section{padding:68px 0;border-bottom:1px solid var(--line)}.section-heading{max-width:760px;margin-bottom:30px}.section-heading h2,.rationale h2{font-family:Georgia,serif;font-size:clamp(2.1rem,4vw,3.6rem);line-height:1.08;letter-spacing:-.03em;margin:4px 0 14px}.section-heading>p:last-child{color:var(--muted);font-size:1.05rem}.decision-lead{padding-top:54px}.decision-question{font-size:1rem;color:var(--muted);margin:0 0 14px}.recommendation{display:grid;grid-template-columns:160px 1fr;gap:24px;align-items:start;padding:27px 0;border-block:2px solid var(--ink)}.recommendation span{text-transform:uppercase;letter-spacing:.1em;font-size:.75rem;font-weight:850;color:var(--forest)}.recommendation strong{font-family:Georgia,serif;font-size:clamp(1.8rem,3.7vw,3rem);line-height:1.12}.rationale{max-width:790px;margin-top:38px}.rationale p{font-size:1.15rem;color:#34413b}.change-columns{display:grid;grid-template-columns:1fr 1fr;gap:0;border-block:1px solid var(--line)}.change-columns>div{padding:26px 34px 12px 0}.change-columns>div+div{padding-left:34px;border-left:1px solid var(--line)}.change-columns>div>h3{font-family:Georgia,serif;font-size:1.7rem;margin:0 0 22px}.claim{position:relative;padding:20px 0;border-top:1px solid var(--line)}.claim-status{display:block;color:var(--muted);font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.claim h4{font-size:1.06rem;margin:4px 0 7px}.claim p{margin:0;color:#3d4842}.citations{display:inline-flex;gap:3px;margin-left:4px;vertical-align:super}.citation{width:17px;height:17px;display:inline-grid;place-items:center;border:1px solid #9ca8a1;border-radius:50%;font-size:.63rem;font-weight:850;text-decoration:none;color:var(--forest);background:var(--panel)}.citation:hover,.citation:focus-visible{background:var(--forest);color:white;outline:2px solid #91bda9}.visual{margin:28px 0 46px;padding:30px;border:1px solid var(--line);border-radius:8px;background:rgba(255,253,247,.75);box-shadow:var(--shadow);scroll-margin-top:80px}.visual-header{display:flex;justify-content:space-between;gap:24px;margin-bottom:26px}.visual-header h3{font-family:Georgia,serif;font-size:clamp(1.5rem,3vw,2.25rem);margin:0 0 7px}.visual-header p:last-child{margin:0;color:var(--muted)}.comparison-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line)}.comparison-side{padding:28px;min-width:0}.comparison-side+*{border-left:1px solid var(--line)}.comparison-side>span{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--ink);color:white;font-weight:850}.comparison-side h4{font-size:1.2rem;margin:16px 0 5px}.comparison-side>strong{color:var(--forest)}.mapping-table{border-top:1px solid var(--line)}.mapping-row{display:grid;grid-template-columns:minmax(140px,.7fr) 42px minmax(0,1.4fr);align-items:center;gap:12px;padding:20px 0;border-bottom:1px solid var(--line)}.mapping-arrow{font-size:1.6rem;color:var(--forest);text-align:center}.mapping-row p{margin:4px 0 0;color:var(--muted)}.mapping-row div>span{font-weight:800;color:var(--blue)}.flow-canvas{display:flex;align-items:stretch;overflow-x:auto;padding:8px 2px 20px}.flow-node{flex:0 0 150px;min-height:130px;text-align:left;padding:16px;border:1px solid #9daba3;background:var(--panel);cursor:pointer}.flow-node>span,.timeline-node>span,.guided-step>span{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:var(--ink);color:white;font-weight:850}.flow-node strong,.flow-node small{display:block;margin-top:10px}.flow-node small,.timeline-node small,.guided-step small{color:var(--muted)}.flow-node[aria-pressed="true"],.timeline-node[aria-pressed="true"],.guided-step[aria-pressed="true"]{border-color:var(--forest);background:var(--forest-soft);outline:2px solid var(--forest)}.flow-connector{flex:0 0 76px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:var(--forest)}.flow-connector span{font-size:.68rem;text-align:center;color:var(--muted);min-height:32px}.flow-connector b{font-size:1.7rem}.visual-panel{background:var(--ink);color:white;padding:24px;min-height:150px}.visual-panel h4{font-family:Georgia,serif;font-size:1.45rem;margin:4px 0 8px}.visual-panel p{color:#dfe7e2}.visual-panel code{display:block;background:#0d1511;padding:12px;overflow-x:auto}.panel-state{margin:0!important;color:#8dd5b2!important;font-size:.72rem;font-weight:850;text-transform:uppercase;letter-spacing:.1em}.timeline-track{display:flex;position:relative;overflow-x:auto;padding:10px 0 24px}.timeline-track:before{content:"";position:absolute;left:60px;right:60px;top:35px;height:2px;background:var(--forest)}.timeline-node{position:relative;flex:1 0 140px;z-index:1;border:0;background:transparent;text-align:center;cursor:pointer;padding:0 12px}.timeline-node>span{margin:auto}.timeline-node strong,.timeline-node small{display:block;margin-top:10px}.timeline-node[aria-pressed="true"]{outline-offset:5px}.guided-layout{display:grid;grid-template-columns:minmax(180px,.65fr) minmax(0,1.35fr);gap:22px}.guided-steps{border-left:2px solid var(--line)}.guided-step{display:grid;width:100%;grid-template-columns:34px 1fr;gap:12px;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;padding:14px 14px 14px 18px;cursor:pointer}.guided-step strong,.guided-step small{display:block}.guided-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}.guided-actions button,.secondary-button{border:1px solid var(--ink);background:transparent;padding:9px 14px;cursor:pointer}.criteria-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.criteria-list li{display:grid;grid-template-columns:44px 1fr;gap:16px;padding:22px 0;border-bottom:1px solid var(--line)}.criterion-index{font-family:Georgia,serif;font-size:1.7rem;color:var(--forest)}.criterion-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.criterion-head strong{font-size:1.1rem}.criteria-list p{margin:5px 0 0;color:var(--muted)}.status{font-size:.7rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.status-proven{color:var(--forest)}.status-missing{color:var(--red)}.status-planned{color:var(--amber)}.risk-row{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;padding:28px 0;border-top:1px solid var(--line)}.risk-row h3{font-family:Georgia,serif;font-size:1.5rem;margin:0}.risk-row p{margin:0 0 12px}.open-questions,.discussion{margin-top:34px;padding:26px;border-left:4px solid var(--amber);background:var(--amber-soft)}details{border-top:1px solid rgba(24,33,29,.2);padding:13px 0}summary{font-weight:750;cursor:pointer}details p{margin:8px 0 0}.foundation-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:48px}.foundation-grid>div>h3{font-family:Georgia,serif;font-size:1.5rem}.objective-list{padding-left:20px}.objective-list li{margin:12px 0}.background-list .claim:first-child{border-top:0;padding-top:0}.intuition{display:grid;grid-template-columns:1fr 1.25fr;gap:30px;margin-top:42px;padding:30px;background:var(--ink);color:white}.intuition>div>span{display:block;color:#8dd5b2;text-transform:uppercase;letter-spacing:.1em;font-size:.72rem;font-weight:850}.intuition>div>strong{display:block;font-family:Georgia,serif;font-size:1.6rem;line-height:1.25;margin-top:9px}.intuition dl{margin:0}.intuition dl>div{display:grid;grid-template-columns:70px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid #52605a}.intuition dt{color:#8dd5b2;font-weight:750}.intuition dd{margin:0}.walkthrough-list{border-top:1px solid var(--line)}.walkthrough-step{display:grid;grid-template-columns:52px 1fr;gap:22px;padding:30px 0;border-bottom:1px solid var(--line);scroll-margin-top:80px}.step-number{font-family:Georgia,serif;font-size:2rem;color:var(--forest)}.walkthrough-step h3{font-family:Georgia,serif;font-size:1.55rem;margin:3px 0 4px}.location{font:600 .78rem/1.5 "SFMono-Regular",monospace;color:var(--muted);overflow-wrap:anywhere}.walkthrough-step pre{overflow:auto;padding:18px;background:var(--ink);color:#dcebe2}.consequence{display:grid;grid-template-columns:120px 1fr;gap:12px;padding:13px 16px;background:var(--forest-soft)}.consequence strong{color:var(--forest)}.checkpoints{padding-left:20px}.edge-list{border-top:1px solid var(--line)}.edge-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;padding:24px 0;border-bottom:1px solid var(--line)}.edge-row h3{margin:0;font-family:Georgia,serif;font-size:1.3rem}.edge-row p{margin:0}.edge-row p>strong{display:block;color:var(--forest);font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}.quiz-question{border:0;border-bottom:1px solid var(--line);padding:28px 0;margin:0}.quiz-question legend{font-weight:800;font-size:1.08rem;display:flex;gap:12px}.quiz-question legend>span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:white;flex:0 0 auto}.quiz-options{display:grid;gap:8px;margin:16px 0 10px}.quiz-option{display:grid;grid-template-columns:auto 28px 1fr;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--line);background:var(--panel);cursor:pointer}.quiz-option:has(input:checked){border-color:var(--forest);background:var(--forest-soft)}.quiz-option.correct-answer{border:2px solid var(--forest);background:var(--forest-soft)}.quiz-option.incorrect-answer{border-color:var(--red);background:var(--red-soft)}.option-letter{font-weight:850}.rationale{margin:0;padding:11px 14px;border-left:3px solid var(--blue);background:var(--blue-soft)}.rationale.incorrect{border-color:var(--red);background:var(--red-soft)}.review-link{display:inline-block;margin:8px 10px 0 0;font-weight:800}.quiz-actions{display:flex;align-items:center;gap:12px;margin-top:24px}.primary-button{border:0;background:var(--ink);color:white;padding:11px 17px;font-weight:800;cursor:pointer}.primary-button:disabled{opacity:.42;cursor:not-allowed}.quiz-actions output{font-weight:750}.sources-section{border-bottom:0}.source-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.source-list li{display:grid;grid-template-columns:44px 1fr;gap:16px;padding:20px 0;border-bottom:1px solid var(--line);scroll-margin-top:80px}.source-list li:target{background:var(--forest-soft)}.source-number{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--forest);border-radius:50%;font-weight:850;color:var(--forest)}.source-list strong,.source-list code{display:block}.source-list code{margin-top:3px;color:var(--muted);overflow-wrap:anywhere}.source-list p{margin:7px 0 0}.limitations{margin-top:34px;padding:24px;border-left:4px solid var(--blue);background:var(--blue-soft)}.limitations h3{margin-top:0}.footer-note{padding:26px 0 52px;color:var(--muted);font-size:.85rem}
    @media(max-width:760px){.shell{width:min(100% - 22px,1080px)}.hero{padding-top:48px}.hero-meta,.change-columns,.foundation-grid,.intuition,.risk-row,.edge-row,.guided-layout{grid-template-columns:1fr}.hero-meta{gap:16px}.section-nav .shell{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.section-nav a{display:grid;place-items:center;min-height:38px;padding:5px 4px;text-align:center;font-size:.72rem;line-height:1.15}.change-columns>div,.change-columns>div+div{padding:22px 0;border-left:0}.change-columns>div+div{border-top:2px solid var(--ink)}.comparison-grid{grid-template-columns:1fr}.comparison-side+*{border-left:0;border-top:1px solid var(--line)}.visual{padding:20px 14px}.mapping-row{grid-template-columns:1fr 28px 1.3fr}.criterion-head{display:block}.status{display:block;margin-top:5px}.intuition dl{margin-top:18px}.consequence{grid-template-columns:1fr}.edge-row{gap:10px}.quiz-option{grid-template-columns:auto 24px 1fr}.quiz-actions{align-items:flex-start;flex-wrap:wrap}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  `;
}

function clientScript() {
  return `
    document.querySelectorAll('[data-visual]').forEach(function(visual){
      var controls=Array.from(visual.querySelectorAll('[data-visual-control]'));
      var panels=Array.from(visual.querySelectorAll('[data-visual-panel]'));
      function select(control){
        controls.forEach(function(item){item.setAttribute('aria-pressed',String(item===control));});
        panels.forEach(function(panel){panel.hidden=panel.dataset.visualPanel!==control.dataset.target;});
      }
      controls.forEach(function(control){
        control.addEventListener('click',function(){select(control);});
        control.addEventListener('keydown',function(event){
          var current=controls.indexOf(control);var next=current;
          if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%controls.length;
          else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current-1+controls.length)%controls.length;
          else if(event.key==='Home')next=0;else if(event.key==='End')next=controls.length-1;else return;
          event.preventDefault();controls[next].focus();select(controls[next]);
        });
      });
      var previous=visual.querySelector('[data-visual-prev]');var next=visual.querySelector('[data-visual-next]');
      if(previous)previous.addEventListener('click',function(){var current=controls.findIndex(function(item){return item.getAttribute('aria-pressed')==='true';});select(controls[(current-1+controls.length)%controls.length]);});
      if(next)next.addEventListener('click',function(){var current=controls.findIndex(function(item){return item.getAttribute('aria-pressed')==='true';});select(controls[(current+1)%controls.length]);});
    });
    var sections=Array.from(document.querySelectorAll('main>section[id]'));var navLinks=Array.from(document.querySelectorAll('.section-nav a'));
    if('IntersectionObserver' in window){new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;navLinks.forEach(function(link){link.setAttribute('aria-current',String(link.getAttribute('href')==='#'+entry.target.id));});});},{rootMargin:'-20% 0px -70% 0px'}).observe(sections[0]);sections.slice(1).forEach(function(section){new IntersectionObserver(function(entries){if(entries[0].isIntersecting)navLinks.forEach(function(link){link.setAttribute('aria-current',String(link.getAttribute('href')==='#'+section.id));});},{rootMargin:'-20% 0px -70% 0px'}).observe(section);});}
    var form=document.getElementById('quiz-form');
    if(form){
      var questions=Array.from(form.querySelectorAll('.quiz-question'));var submit=form.querySelector('[type="submit"]');var result=document.getElementById('quiz-result');
      function complete(){return questions.every(function(question){return Boolean(question.querySelector('input:checked'));});}
      form.addEventListener('change',function(){submit.disabled=!complete();result.textContent='';});
      form.addEventListener('submit',function(event){
        event.preventDefault();if(!complete())return;var score=0;
        questions.forEach(function(question){
          var selected=Number(question.querySelector('input:checked').value);var correct=Number(question.dataset.correct);if(selected===correct)score+=1;
          question.querySelectorAll('.quiz-option').forEach(function(option){var value=Number(option.querySelector('input').value);option.classList.toggle('correct-answer',value===correct);option.classList.toggle('incorrect-answer',value===selected&&selected!==correct);});
          question.querySelectorAll('.rationale').forEach(function(rationale){var option=Number(rationale.dataset.option);rationale.hidden=option!==selected&&option!==correct;rationale.classList.toggle('incorrect',option===selected&&selected!==correct);});
          question.querySelector('.review-link').hidden=false;
        });
        result.textContent='Score: '+score+' / '+questions.length+'. Review any revealed rationale, then retry if useful.';
      });
      form.addEventListener('reset',function(){setTimeout(function(){submit.disabled=true;result.textContent='';form.querySelectorAll('.rationale').forEach(function(rationale){rationale.hidden=true;rationale.classList.remove('incorrect');});form.querySelectorAll('.review-link').forEach(function(link){link.hidden=true;});form.querySelectorAll('.quiz-option').forEach(function(option){option.classList.remove('correct-answer','incorrect-answer');});},0);});
    }
  `;
}

function main() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help || !args.input || !args.output) {
      console.log("Usage: node scripts/render-understanding-pack.mjs --input <pack.json> --output <pack.html>");
      process.exit(args.help ? 0 : 1);
    }
    const outputPath = resolve(args.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, renderUnderstandingPack(loadPack(args.input)), "utf8");
    console.log(`Rendered understanding pack: ${outputPath}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
