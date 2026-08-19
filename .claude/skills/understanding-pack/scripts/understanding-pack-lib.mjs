import { readFileSync } from "node:fs";

const FIGURE_KINDS = new Set(["flow", "comparison", "state-timeline", "mapping", "guided-steps"]);
const MODES = new Set(["change", "system", "guided"]);
const PROFILES = new Set(["decision-brief", "training-pack"]);
const SOURCE_KINDS = new Set(["repo", "diff", "document", "attachment", "url", "runtime", "inference"]);
const CLAIM_STATUSES = new Set(["observed", "proposed", "inference", "unknown"]);
const APPROVAL_STATUSES = new Set(["proven", "missing", "planned"]);

export function loadPack(inputPath) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${inputPath}: ${error.message}`);
  }
  return parsed;
}

export function parseCliArgs(rawArgs) {
  const args = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Unknown positional argument: ${arg}`);
    const key = arg.slice(2);
    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

export function validateUnderstandingPack(pack) {
  const errors = [];
  const add = (path, message) => errors.push(`${path}: ${message}`);
  const object = (value, path) => {
    if (!isObject(value)) {
      add(path, "must be an object");
      return false;
    }
    return true;
  };
  const string = (value, path, { allowEmpty = false } = {}) => {
    if (typeof value !== "string" || (!allowEmpty && !value.trim())) {
      add(path, allowEmpty ? "must be a string" : "must be a non-empty string");
      return false;
    }
    return true;
  };
  const identifier = (value, path) => {
    if (!string(value, path)) return false;
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/u.test(value)) {
      add(path, "must start with a letter and contain only letters, digits, underscores, or hyphens");
      return false;
    }
    return true;
  };
  const knownKeys = (value, path, allowed) => {
    if (!isObject(value)) return;
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) add(`${path}.${key}`, "is not allowed by the output contract");
    }
  };
  const array = (value, path, minimum = 0, maximum = Infinity) => {
    if (!Array.isArray(value)) {
      add(path, "must be an array");
      return false;
    }
    if (value.length < minimum) add(path, `must contain at least ${minimum} item(s)`);
    if (value.length > maximum) add(path, `must contain no more than ${maximum} item(s)`);
    return true;
  };
  const stringArray = (value, path, minimum = 0, maximum = Infinity) => {
    if (!array(value, path, minimum, maximum)) return;
    value.forEach((entry, index) => string(entry, `${path}[${index}]`));
  };

  if (!object(pack, "$")) return errors;
  knownKeys(pack, "$", new Set([
    "schemaVersion", "profile", "title", "subtitle", "mode", "audience",
    "sourceScope", "visuals", "decisionBrief", "trainingPack", "limitations"
  ]));
  if (pack.schemaVersion !== "2.0") add("schemaVersion", "must equal 2.0; v1 packs must be regenerated with an explicit profile");
  if (!PROFILES.has(pack.profile)) add("profile", "must be decision-brief or training-pack");
  string(pack.title, "title");
  string(pack.subtitle, "subtitle");
  if (!MODES.has(pack.mode)) add("mode", "must be change, system, or guided");

  if (object(pack.audience, "audience")) {
    knownKeys(pack.audience, "audience", new Set(["role", "priorKnowledge", "participationGoal"]));
    string(pack.audience.role, "audience.role");
    stringArray(pack.audience.priorKnowledge, "audience.priorKnowledge");
    string(pack.audience.participationGoal, "audience.participationGoal");
  }

  const sourceIds = new Set();
  const sourcesById = new Map();
  if (object(pack.sourceScope, "sourceScope")) {
    knownKeys(pack.sourceScope, "sourceScope", new Set(["summary", "revision", "generatedAt", "sources"]));
    string(pack.sourceScope.summary, "sourceScope.summary");
    string(pack.sourceScope.revision, "sourceScope.revision");
    if (string(pack.sourceScope.generatedAt, "sourceScope.generatedAt") && Number.isNaN(Date.parse(pack.sourceScope.generatedAt))) {
      add("sourceScope.generatedAt", "must be an ISO-8601 date-time");
    }
    if (array(pack.sourceScope.sources, "sourceScope.sources", 1)) {
      pack.sourceScope.sources.forEach((source, index) => {
        const path = `sourceScope.sources[${index}]`;
        if (!object(source, path)) return;
        knownKeys(source, path, new Set(["id", "label", "kind", "locator", "lines", "evidence"]));
        if (identifier(source.id, `${path}.id`)) {
          if (sourceIds.has(source.id)) add(`${path}.id`, `duplicates source ID ${source.id}`);
          sourceIds.add(source.id);
          sourcesById.set(source.id, source);
        }
        string(source.label, `${path}.label`);
        if (!SOURCE_KINDS.has(source.kind)) add(`${path}.kind`, "uses an unsupported source kind");
        string(source.locator, `${path}.locator`);
        if (source.lines !== undefined) string(source.lines, `${path}.lines`, { allowEmpty: true });
        string(source.evidence, `${path}.evidence`);
      });
    }
  }

  validateVisuals(pack.visuals, sourceIds, { add, array, object, string, identifier, knownKeys });
  stringArray(pack.limitations, "limitations", 0, 8);

  if (pack.profile === "decision-brief") {
    if (pack.trainingPack !== undefined) add("trainingPack", "must be omitted for a decision brief");
    validateDecisionBrief(pack.decisionBrief, sourceIds, { add, array, object, string, knownKeys });
    if (Array.isArray(pack.visuals) && pack.visuals.length > 2) add("visuals", "a decision brief may contain no more than two visuals");
  }

  if (pack.profile === "training-pack") {
    if (pack.decisionBrief !== undefined) add("decisionBrief", "must be omitted for a training pack");
    const reviewTargets = new Set(["foundation", "edges"]);
    pack.visuals?.forEach((visual) => reviewTargets.add(`visual:${visual.id}`));
    pack.trainingPack?.walkthrough?.forEach((step) => reviewTargets.add(`walkthrough:${step.id}`));
    validateTrainingPack(pack.trainingPack, sourceIds, { add, array, object, string, identifier, knownKeys, stringArray, reviewTargets });
  }

  const primaryWordCount = countPrimaryWords(pack);
  const maximumWords = pack.profile === "decision-brief" ? 1100 : 2600;
  if (primaryWordCount > maximumWords) {
    add("$", `contains ${primaryWordCount} primary words; ${pack.profile} is limited to ${maximumWords}`);
  }

  for (const duplicate of findRepeatedPrimaryPassages(pack)) {
    add(duplicate.path, `repeats a ${duplicate.words}-word passage already used at ${duplicate.firstPath}`);
  }

  validateHumanIntentClaims(pack, sourcesById, add);
  return errors;
}

function validateDecisionBrief(brief, sourceIds, helpers) {
  const { add, array, object, string, knownKeys } = helpers;
  if (!object(brief, "decisionBrief")) return;
  knownKeys(brief, "decisionBrief", new Set([
    "question", "recommendation", "rationale", "currentState", "proposedChange",
    "approvalCriteria", "risks", "openQuestions"
  ]));
  string(brief.question, "decisionBrief.question");
  string(brief.recommendation, "decisionBrief.recommendation");
  validateClaim(brief.rationale, "decisionBrief.rationale", sourceIds, helpers);
  if (array(brief.currentState, "decisionBrief.currentState", 1, 4)) {
    brief.currentState.forEach((claim, index) => {
      validateClaim(claim, `decisionBrief.currentState[${index}]`, sourceIds, helpers);
      if (claim?.status === "proposed") add(`decisionBrief.currentState[${index}].status`, "current behavior cannot be labeled proposed");
    });
  }
  if (array(brief.proposedChange, "decisionBrief.proposedChange", 1, 4)) {
    brief.proposedChange.forEach((claim, index) => {
      validateClaim(claim, `decisionBrief.proposedChange[${index}]`, sourceIds, helpers);
      if (claim?.status === "observed") add(`decisionBrief.proposedChange[${index}].status`, "planned behavior cannot be labeled observed");
    });
  }
  if (array(brief.approvalCriteria, "decisionBrief.approvalCriteria", 2, 5)) {
    brief.approvalCriteria.forEach((entry, index) => {
      const path = `decisionBrief.approvalCriteria[${index}]`;
      if (!object(entry, path)) return;
      knownKeys(entry, path, new Set(["criterion", "evidenceRequired", "status", "sourceIds"]));
      string(entry.criterion, `${path}.criterion`);
      string(entry.evidenceRequired, `${path}.evidenceRequired`);
      if (!APPROVAL_STATUSES.has(entry.status)) add(`${path}.status`, "must be proven, missing, or planned");
      validateSourceReferences(entry.sourceIds, `${path}.sourceIds`, sourceIds, add);
    });
  }
  if (array(brief.risks, "decisionBrief.risks", 1, 4)) {
    brief.risks.forEach((entry, index) => {
      const path = `decisionBrief.risks[${index}]`;
      if (!object(entry, path)) return;
      knownKeys(entry, path, new Set(["risk", "impact", "mitigation", "sourceIds"]));
      string(entry.risk, `${path}.risk`);
      string(entry.impact, `${path}.impact`);
      string(entry.mitigation, `${path}.mitigation`);
      validateSourceReferences(entry.sourceIds, `${path}.sourceIds`, sourceIds, add);
    });
  }
  if (array(brief.openQuestions, "decisionBrief.openQuestions", 0, 4)) {
    brief.openQuestions.forEach((entry, index) => {
      const path = `decisionBrief.openQuestions[${index}]`;
      if (!object(entry, path)) return;
      knownKeys(entry, path, new Set(["question", "whyItMatters", "sourceIds"]));
      string(entry.question, `${path}.question`);
      string(entry.whyItMatters, `${path}.whyItMatters`);
      validateSourceReferences(entry.sourceIds, `${path}.sourceIds`, sourceIds, add);
    });
  }
}

function validateTrainingPack(training, sourceIds, helpers) {
  const { add, array, object, string, identifier, knownKeys, stringArray } = helpers;
  if (!object(training, "trainingPack")) return;
  knownKeys(training, "trainingPack", new Set([
    "learningObjectives", "background", "intuition", "walkthrough", "edgeCases",
    "discussionPrompts", "quiz"
  ]));
  stringArray(training.learningObjectives, "trainingPack.learningObjectives", 2, 5);
  if (array(training.background, "trainingPack.background", 1, 3)) {
    training.background.forEach((claim, index) => validateClaim(claim, `trainingPack.background[${index}]`, sourceIds, helpers));
  }
  if (object(training.intuition, "trainingPack.intuition")) {
    knownKeys(training.intuition, "trainingPack.intuition", new Set(["essence", "example", "sourceIds"]));
    string(training.intuition.essence, "trainingPack.intuition.essence");
    if (object(training.intuition.example, "trainingPack.intuition.example")) {
      knownKeys(training.intuition.example, "trainingPack.intuition.example", new Set(["input", "result", "why"]));
      string(training.intuition.example.input, "trainingPack.intuition.example.input");
      string(training.intuition.example.result, "trainingPack.intuition.example.result");
      string(training.intuition.example.why, "trainingPack.intuition.example.why");
    }
    validateSourceReferences(training.intuition.sourceIds, "trainingPack.intuition.sourceIds", sourceIds, add);
  }
  const sequences = new Set();
  let previousSequence = 0;
  if (array(training.walkthrough, "trainingPack.walkthrough", 2, 7)) {
    training.walkthrough.forEach((step, index) => {
      const path = `trainingPack.walkthrough[${index}]`;
      if (!object(step, path)) return;
      knownKeys(step, path, new Set(["id", "sequence", "title", "whyNow", "sourceId", "location", "language", "code", "explanation", "consequence", "checkpoints"]));
      identifier(step.id, `${path}.id`);
      if (!Number.isInteger(step.sequence) || step.sequence < 1) add(`${path}.sequence`, "must be a positive integer");
      else {
        if (sequences.has(step.sequence)) add(`${path}.sequence`, `duplicates sequence ${step.sequence}`);
        if (step.sequence <= previousSequence) add(`${path}.sequence`, "must be in ascending causal order");
        sequences.add(step.sequence);
        previousSequence = step.sequence;
      }
      string(step.title, `${path}.title`);
      string(step.whyNow, `${path}.whyNow`);
      if (!sourceIds.has(step.sourceId)) add(`${path}.sourceId`, `does not match a source ID: ${step.sourceId}`);
      string(step.location, `${path}.location`);
      if (step.language !== undefined) string(step.language, `${path}.language`, { allowEmpty: true });
      if (step.code !== undefined) string(step.code, `${path}.code`, { allowEmpty: true });
      string(step.explanation, `${path}.explanation`);
      string(step.consequence, `${path}.consequence`);
      stringArray(step.checkpoints, `${path}.checkpoints`, 0, 4);
    });
  }
  if (array(training.edgeCases, "trainingPack.edgeCases", 1, 5)) {
    training.edgeCases.forEach((edge, index) => {
      const path = `trainingPack.edgeCases[${index}]`;
      if (!object(edge, path)) return;
      knownKeys(edge, path, new Set(["scenario", "behavior", "why", "sourceIds"]));
      string(edge.scenario, `${path}.scenario`);
      string(edge.behavior, `${path}.behavior`);
      string(edge.why, `${path}.why`);
      validateSourceReferences(edge.sourceIds, `${path}.sourceIds`, sourceIds, add);
    });
  }
  if (array(training.discussionPrompts, "trainingPack.discussionPrompts", 0, 3)) {
    training.discussionPrompts.forEach((entry, index) => {
      const path = `trainingPack.discussionPrompts[${index}]`;
      if (!object(entry, path)) return;
      knownKeys(entry, path, new Set(["prompt", "why"]));
      string(entry.prompt, `${path}.prompt`);
      string(entry.why, `${path}.why`);
    });
  }
  if (training.quiz !== undefined) validateQuiz(training.quiz, sourceIds, helpers);
}

function validateQuiz(quiz, sourceIds, helpers) {
  const { add, array, object, string, identifier, knownKeys, reviewTargets } = helpers;
  if (!object(quiz, "trainingPack.quiz")) return;
  knownKeys(quiz, "trainingPack.quiz", new Set(["instructions", "questions"]));
  string(quiz.instructions, "trainingPack.quiz.instructions");
  const correctCounts = [0, 0, 0, 0];
  const questionIds = new Set();
  if (array(quiz.questions, "trainingPack.quiz.questions", 3, 5)) {
    quiz.questions.forEach((question, index) => {
      const path = `trainingPack.quiz.questions[${index}]`;
      if (!object(question, path)) return;
      knownKeys(question, path, new Set(["id", "prompt", "supportingClaim", "reviewTarget", "options", "correctIndex", "sourceIds"]));
      if (identifier(question.id, `${path}.id`)) {
        if (questionIds.has(question.id)) add(`${path}.id`, `duplicates question ID ${question.id}`);
        questionIds.add(question.id);
      }
      string(question.prompt, `${path}.prompt`);
      string(question.supportingClaim, `${path}.supportingClaim`);
      if (string(question.reviewTarget, `${path}.reviewTarget`) && !reviewTargets.has(question.reviewTarget)) {
        add(`${path}.reviewTarget`, `does not match a rendered teaching passage: ${question.reviewTarget}`);
      }
      if (array(question.options, `${path}.options`, 4, 4)) {
        question.options.forEach((option, optionIndex) => {
          const optionPath = `${path}.options[${optionIndex}]`;
          if (!object(option, optionPath)) return;
          knownKeys(option, optionPath, new Set(["label", "rationale"]));
          string(option.label, `${optionPath}.label`);
          string(option.rationale, `${optionPath}.rationale`);
        });
      }
      if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
        add(`${path}.correctIndex`, "must be an integer from 0 through 3");
      } else {
        correctCounts[question.correctIndex] += 1;
      }
      validateSourceReferences(question.sourceIds, `${path}.sourceIds`, sourceIds, add);
    });
    const requiredPositions = quiz.questions.length >= 4 ? 3 : 2;
    if (correctCounts.filter((count) => count > 0).length < requiredPositions) {
      add("trainingPack.quiz.questions", `correct answers must use at least ${requiredPositions} distinct option positions`);
    }
    if (correctCounts.some((count) => count > 2)) {
      add("trainingPack.quiz.questions", "the same correct-answer position may not appear more than twice");
    }
  }
}

function validateClaim(claim, path, sourceIds, helpers) {
  const { add, object, string, knownKeys } = helpers;
  if (!object(claim, path)) return;
  knownKeys(claim, path, new Set(["title", "body", "status", "sourceIds"]));
  string(claim.title, `${path}.title`);
  string(claim.body, `${path}.body`);
  if (!CLAIM_STATUSES.has(claim.status)) add(`${path}.status`, "must be observed, proposed, inference, or unknown");
  validateSourceReferences(claim.sourceIds, `${path}.sourceIds`, sourceIds, add);
}

function validateVisuals(visuals, sourceIds, helpers) {
  const { add, array, object, string, identifier, knownKeys } = helpers;
  const visualIds = new Set();
  if (!array(visuals, "visuals", 1, 3)) return;
  visuals.forEach((visual, index) => {
    const path = `visuals[${index}]`;
    if (!object(visual, path)) return;
    knownKeys(visual, path, new Set(["id", "title", "kind", "teachingGoal", "sourceIds", "items", "links"]));
    if (identifier(visual.id, `${path}.id`)) {
      if (visualIds.has(visual.id)) add(`${path}.id`, `duplicates visual ID ${visual.id}`);
      visualIds.add(visual.id);
    }
    string(visual.title, `${path}.title`);
    if (!FIGURE_KINDS.has(visual.kind)) add(`${path}.kind`, "uses an unsupported visual kind");
    string(visual.teachingGoal, `${path}.teachingGoal`);
    validateSourceReferences(visual.sourceIds, `${path}.sourceIds`, sourceIds, add);
    const itemIds = new Set();
    if (array(visual.items, `${path}.items`, 2, 8)) {
      visual.items.forEach((item, itemIndex) => {
        const itemPath = `${path}.items[${itemIndex}]`;
        if (!object(item, itemPath)) return;
        knownKeys(item, itemPath, new Set(["id", "label", "detail", "state", "command"]));
        if (identifier(item.id, `${itemPath}.id`)) {
          if (itemIds.has(item.id)) add(`${itemPath}.id`, `duplicates visual item ID ${item.id}`);
          itemIds.add(item.id);
        }
        string(item.label, `${itemPath}.label`);
        string(item.detail, `${itemPath}.detail`);
        if (item.state !== undefined) string(item.state, `${itemPath}.state`, { allowEmpty: true });
        if (item.command !== undefined) string(item.command, `${itemPath}.command`, { allowEmpty: true });
      });
    }
    if (visual.kind === "comparison" && Array.isArray(visual.items) && visual.items.length !== 2) {
      add(`${path}.items`, "comparison visuals must contain exactly two items");
    }
    if (array(visual.links, `${path}.links`)) {
      visual.links.forEach((link, linkIndex) => {
        const linkPath = `${path}.links[${linkIndex}]`;
        if (!object(link, linkPath)) return;
        knownKeys(link, linkPath, new Set(["from", "to", "label"]));
        if (!itemIds.has(link.from)) add(`${linkPath}.from`, `does not match an item ID: ${link.from}`);
        if (!itemIds.has(link.to)) add(`${linkPath}.to`, `does not match an item ID: ${link.to}`);
        if (link.label !== undefined) string(link.label, `${linkPath}.label`, { allowEmpty: true });
      });
    }
    if (visual.kind === "flow" && Array.isArray(visual.links) && visual.links.length < 1) {
      add(`${path}.links`, "flow visuals need at least one directional link");
    }
  });
}

export function countPrimaryWords(pack) {
  const roots = [pack.title, pack.subtitle, pack.audience?.participationGoal, pack.visuals, pack.limitations];
  if (pack.profile === "decision-brief") roots.push(pack.decisionBrief);
  if (pack.profile === "training-pack") roots.push(pack.trainingPack);
  return roots.flatMap((value) => collectStrings(value)).reduce((total, value) => total + wordCount(value), 0);
}

function findRepeatedPrimaryPassages(pack) {
  const roots = pack.profile === "decision-brief"
    ? [["decisionBrief", pack.decisionBrief], ["visuals", pack.visuals]]
    : [["trainingPack", pack.trainingPack], ["visuals", pack.visuals]];
  const seen = new Map();
  const duplicates = [];
  for (const [rootPath, value] of roots) {
    for (const entry of collectStringEntries(value, rootPath)) {
      const words = wordCount(entry.value);
      if (words < 12) continue;
      const normalized = entry.value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
      if (seen.has(normalized)) duplicates.push({ path: entry.path, firstPath: seen.get(normalized), words });
      else seen.set(normalized, entry.path);
    }
  }
  return duplicates;
}

function validateHumanIntentClaims(pack, sourcesById, add) {
  const claims = collectEvidenceClaims(pack.profile === "decision-brief" ? pack.decisionBrief : pack.trainingPack, pack.profile);
  pack.visuals?.forEach((visual, index) => claims.push([`visuals[${index}]`, { body: collectStrings(visual).join(" "), sourceIds: visual.sourceIds }]));
  pack.trainingPack?.walkthrough?.forEach((step, index) => claims.push([
    `trainingPack.walkthrough[${index}]`,
    { body: collectStrings(step).join(" "), sourceIds: [step.sourceId] }
  ]));
  for (const [path, claim] of claims) {
    const text = `${claim?.title ?? ""} ${claim?.body ?? ""}`;
    if (!/(model cannot|model can never|only (?:a )?human|human-only|outside (?:the )?model)/iu.test(text)) continue;
    const evidence = (claim.sourceIds ?? []).map((id) => sourcesById.get(id)).filter(Boolean)
      .map((source) => `${source.label} ${source.locator} ${source.evidence}`).join(" ");
    const namesClientBoundary = /(client|user interface|human interaction|resolution path|model-visible|model control)/iu.test(evidence);
    if (!namesClientBoundary) {
      add(`${path}.sourceIds`, "a human-intent or model-exclusion claim needs cited evidence about the client or resolution trust boundary, not only token integrity");
    }
  }
}

function collectEvidenceClaims(value, path) {
  if (Array.isArray(value)) return value.flatMap((entry, index) => collectEvidenceClaims(entry, `${path}[${index}]`));
  if (!isObject(value)) return [];
  const claims = [];
  if (Array.isArray(value.sourceIds)) {
    claims.push([path, { body: collectStrings(value).join(" "), sourceIds: value.sourceIds }]);
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key !== "sourceIds") claims.push(...collectEvidenceClaims(entry, `${path}.${key}`));
  }
  return claims;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validateSourceReferences(value, path, knownIds, add) {
  if (!Array.isArray(value)) {
    add(path, "must be an array");
    return;
  }
  if (value.length < 1) add(path, "must contain at least one source ID");
  value.forEach((sourceId, index) => {
    if (typeof sourceId !== "string" || !sourceId.trim()) add(`${path}[${index}]`, "must be a non-empty string");
    else if (!knownIds.has(sourceId)) add(`${path}[${index}]`, `does not match a source ID: ${sourceId}`);
  });
}

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => collectStrings(entry));
  if (!isObject(value)) return [];
  return Object.entries(value)
    .filter(([key]) => !["id", "sourceId", "sourceIds", "status", "sequence", "correctIndex", "language", "command"].includes(key))
    .flatMap(([, entry]) => collectStrings(entry));
}

function collectStringEntries(value, path) {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((entry, index) => collectStringEntries(entry, `${path}[${index}]`));
  if (!isObject(value)) return [];
  return Object.entries(value)
    .filter(([key]) => !["id", "sourceId", "sourceIds", "status", "sequence", "correctIndex", "language", "command"].includes(key))
    .flatMap(([key, entry]) => collectStringEntries(entry, `${path}.${key}`));
}

function wordCount(value) {
  return String(value).trim().split(/\s+/u).filter(Boolean).length;
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
