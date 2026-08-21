// lib/quiz.content.ts
// GENERIC PLACEHOLDER quiz content for the template. A fork replaces this with
// the client's doctrine-backed QuizOutput (authored via the
// typeform-quiz-popup-builder skill + validated by the client quality gate).
//
// This default is intentionally niche-neutral ("studio" / "session", no genre,
// no client names, no offer amount) so a fresh fork renders a working quiz it
// can swap copy into. The challenge-quiz STRUCTURE is doctrine: a title slide
// that carries the offer + hook (no separate claim slide), 4 leading objection
// questions each with one best answer + teaching statement, an offer slide,
// a "fair enough" second chance, and progressive lead capture.
//
// Statements here are CONDENSED for quiz UX (~80–100 words); the full
// 150–220-word doctrine statements live in the authoring deliverable that the
// quality gate validates. Keep the two artifacts separate (see
// templates/new-build/docs/quiz-engine.md §"Dual word-count contract").
import type { QuizOutput } from "@/lib/quiz/types";

export const defaultQuizContent: QuizOutput = {
  contract_version: "1.0",
  client_id: "template",
  readiness_label: "review_draft",
  title_slide: {
    headline: "Claim Your Session Offer",
    subhead:
      "Can you get 4 out of 4 right? Don't worry, we'll help you with the answers.",
  },
  main_questions: [
    {
      question:
        "Do you need to look or feel a certain way before you book a session?",
      answer_format: "multiple_choice",
      options: [
        "No, the session is for everyone, and guided posing and lighting do the work",
        "Yes, you should wait until everything feels perfect first",
        "Only if you're already comfortable in front of a camera",
        "Wait until someday, when you finally feel ready",
      ],
      best_answer:
        "No, the session is for everyone, and guided posing and lighting do the work",
      statement:
        '"After things settle down" makes a promise it rarely keeps. What makes images beautiful isn\'t a perfect day. It\'s professional lighting, posing built for you one frame at a time, and direction the whole way through. You don\'t need to be ready first; you need someone whose entire job is to guide you. That part is already handled the moment you book.',
    },
    {
      question:
        "True or false: you have to already be photogenic, or know how to pose, to get great photos.",
      answer_format: "true_false",
      options: [
        "True, some people are just naturally good in front of a camera",
        "False, every pose is guided, so there's nothing to know in advance",
        "It depends on how confident you wake up feeling that morning",
      ],
      best_answer:
        "False, every pose is guided, so there's nothing to know in advance",
      statement:
        'Every photo of yourself you\'ve hated was an accident: bad light, a phone at the worst angle, or a candid no one directed. "Photogenic" isn\'t something you\'re born with; it\'s a setup, and the setup is the photographer\'s job, not yours. You\'re guided pose by pose with nothing to know in advance, which is exactly why nervous first-timers surprise themselves. You just have to show up.',
    },
    {
      question:
        "Working with a professional studio, which of these are actually in your control? (Select all that apply.)",
      answer_format: "select_all",
      options: [
        "You work directly with your photographer, start to finish",
        "The studio is private and by appointment only",
        "You can bring someone for support if you'd like",
        "You decide what's ever shown, nothing is shared without your okay",
        "None of it, once photos exist, they're out of your hands",
      ],
      // Multi-answer: full option texts joined with "; " (see adapt.bestAnswerSet).
      best_answer:
        "You work directly with your photographer, start to finish; The studio is private and by appointment only; You can bring someone for support if you'd like; You decide what's ever shown, nothing is shared without your okay",
      statement:
        "The worry isn't the photos, it's losing control of them. Here it's the opposite: a private, by-appointment studio where you work directly with your photographer every step. Bring someone if it helps you exhale. And you decide what's ever seen. Comfort here isn't a hope; it's how the studio is built.",
    },
    {
      question: "Who is a session like this actually for?",
      answer_format: "multiple_choice",
      options: [
        "Anyone, at any stage, for confidence, a milestone, a gift, or just because",
        "Mostly people who already feel camera-ready",
        "Only people confident enough to pull it off",
        "Just for one specific occasion",
      ],
      best_answer:
        "Anyone, at any stage, for confidence, a milestone, a gift, or just because",
      statement:
        'The quiet voice asking "is this really for someone like me?" was trained by a feed that profits from a narrow ideal. Some people come for confidence, some for a milestone or a gift, some just because. You\'re not too ordinary or too late. Whatever brought you to this quiz is reason enough, and "now" beats "someday."',
    },
  ],
  offer_slide: {
    headline: "You earned it: your session offer is reserved.",
    benefit_bullets: [
      "A guided, professional experience: you arrive and we take care of the rest",
      "A private studio with every pose directed, start to finish",
      "Your offer applied when you book, for any reason that's yours",
    ],
    button_text: "Claim my offer",
  },
  fair_enough_slide: {
    headline: "Not ready to book just yet? Totally fair.",
    paragraph:
      "No pressure at all. Big, personal decisions deserve a little breathing room. Leave your details and we'll hold your offer so it's waiting whenever you're ready, along with honest answers to the questions people ask us most. When the timing's right, it'll be here.",
    second_chance_cta: "Hold my offer",
  },
  info_collection: {
    fields: [
      "Email: Where should we send your results and your offer?",
      "First name: What should we call you?",
      "Phone number: What's the best number for a quick, no-pressure text if you have questions? (We text first and never spam.)",
      "Why: What's making you think about a session right now? A milestone, a gift, your own confidence, or just because? (There's no wrong answer.)",
    ],
  },
  alternate_questions: [
    {
      question: "Spending this on yourself: indulgent, or something else?",
      answer_format: "multiple_choice",
      options: [
        "It's an investment in how you see yourself, long overdue, not indulgent",
        "Indulgent, the money should go to anything else",
        "Fine, but only if you never tell anyone you did it",
        "Maybe later, once everyone else's needs are handled",
      ],
      best_answer:
        "It's an investment in how you see yourself, long overdue, not indulgent",
      statement:
        "The guilt here has a name, and it isn't selfish; it's the habit of going last. Doing something purely for you can feel almost wrong if you're the one who pours into everyone else. This isn't indulgent. It might be the one thing on your list that's finally just for you. The right answer reframes the spend: not money taken from something more important, but proof you were worth celebrating too.",
    },
    {
      question:
        "Will the session feel like you, or does it have to be over-the-top?",
      answer_format: "multiple_choice",
      options: [
        "It's exactly as understated as you want, slow, private, and personal",
        "It always reads as loud and staged, no matter who shoots it",
        "Only if you keep it a complete secret forever",
        "It depends entirely on how brave you're feeling that day",
      ],
      best_answer:
        "It's exactly as understated as you want, slow, private, and personal",
      statement:
        "Tone is a choice, and it starts with who's behind the camera. The approach here is intentionally slow, private, and personal: presence over performance, never spectacle. You set your own comfort level, and every pose is guided so nothing feels unlike you. Understated isn't a compromise you settle for; it's the default.",
    },
    {
      question:
        "What actually happens to your photos after the session?",
      answer_format: "multiple_choice",
      options: [
        "You choose what's kept and what's shown, nothing goes out without your okay",
        "They get posted everywhere automatically",
        "The studio owns them and decides",
        "You never really see the full set",
      ],
      best_answer:
        "You choose what's kept and what's shown, nothing goes out without your okay",
      statement:
        "Your images are yours. You decide what's kept, what's printed, and what, if anything, is ever shared. A professional studio treats that as a baseline, not a favor. The control you're worried about losing is written into how the whole thing works.",
    },
    {
      question:
        "True or false: there's a 'perfect time' to finally book, so it's smart to wait for it.",
      answer_format: "true_false",
      options: [
        "True, wait until the calendar and everything else line up perfectly",
        "False, the perfect time rarely arrives; the right time is when you decide",
        "It depends on the season",
      ],
      best_answer:
        "False, the perfect time rarely arrives; the right time is when you decide",
      statement:
        'The "perfect time" is a moving target. There\'s always one more thing to wait on. The people who are glad they booked didn\'t wait for perfect; they picked a date and let the experience be the reward. The right time is the one you choose. Your offer just makes the first step a little lighter.',
    },
  ],
  thank_you: {
    headline: "You're all set.",
    lines: [
      "Thanks for taking the quiz. Your offer is reserved.",
      "We'll be in touch personally within 1–2 business days.",
    ],
  },
  follow_up_email: {
    subject: "Your quiz results + your session offer",
    body: "Thanks for taking the quiz! Your offer is reserved. Reply to this email or pick a time to book and we'll take it from there.",
  },
};
