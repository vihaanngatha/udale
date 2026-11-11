# Uda le — consolidated requirements

Every point agreed in the brainstorm, with where it lives in the build.

## Product
| # | Requirement | Where |
|---|---|---|
| 1 | Goal: stop overspending (behaviour change, not just tracking) | whole app |
| 2 | No bank account connection; all data stays on the phone, no login | localStorage, no backend for data |
| 3 | iPhone, mobile app → PWA ("Add to Home Screen"), free, no Apple account | manifest, sw.js |
| 4 | Name "Uda le" (only Hindi in the app); all sentences in English, sarcastic and harsh | all copy |
| 5 | Harsh tone aimed at the behaviour, never at the person | copy |

## Money model
| # | Requirement | Where |
|---|---|---|
| 6 | Daily allowance, not a monthly budget; one number "left today" | Home |
| 7 | Unspent rolls over to tomorrow | engine: carry |
| 8 | Overspend comes out of tomorrow | engine: carry |
| 9 | Ask bank balance at start of month (1st), grace until the 3rd, no penalty | month banner, month takeover after the 3rd |
| 10 | During grace, run on last month's daily allowance | engine: grace days |
| 11 | Allowance = (balance − fixed costs − savings) ÷ remaining days | mkMonth |
| 12 | Fixed costs list | Setup, Rules |
| 13 | Mid-month budget change; recalculates; every change logged | Rules → Budget badal, change log, weekly review |
| 14 | Month-end leftover goes to the savings goal | closeMonths |

## Logging
| # | Requirement | Where |
|---|---|---|
| 15 | Log before you pay, fast | Spend tab |
| 16 | Need / want / regret tag | Spend tab, regret can be marked later |
| 17 | User-created categories with caps | Setup, Rules |
| 18 | Pause screen before a want: damage to today/tomorrow, must confirm | Pause takeover (hold to confirm) |
| 19 | "= X days of food" conversion only on the pause screen | Pause takeover |
| 20 | 24-hour wishlist: wants over a chosen amount wait automatically, asked again next day | Wishlist cards on Home |
| 21 | Edit/delete within 10 minutes without it counting as cheating | Entry sheet |
| 22 | Emergency spend: no penalty, reason required, shown in weekly review | Spend tab, review |
| 23 | Payment method UPI / cash (needed for honesty check) | Spend tab |

## Lending & splitting
| # | Requirement | Where |
|---|---|---|
| 24 | Split toggle: total, people, who; only your share counts, rest → "Owed to me" | Spend tab |
| 25 | Lend: comes out of available money right away, returns when settled | Lent mode, Hisaab sheet |
| 26 | Borrow: "I owe" list | Borrowed mode |
| 27 | Debts older than 2 weeks nag on Home with name, amount, days | Home |

## Penalties (all stack)
| # | Requirement | Where |
|---|---|---|
| 28 | Daily limit broken → tomorrow shrinks + streak resets | engine, Home |
| 29 | Category cap broken → category locks until short review | Lock review takeover |
| 30 | Streak counter (small) on Home | Home |

## Reviews & shame
| # | Requirement | Where |
|---|---|---|
| 31 | Weekly review Sunday night, full-screen, can't skip, must acknowledge | Review takeover |
| 32 | Review shows wants/regrets cost and patterns (time, category) | Review |
| 33 | Honesty check: type UPI app's weekly total, gap → "untracked" on Wall of Shame | Review |
| 34 | Wall of Shame: regrets total + "what it could have bought: goal ×0.4" | Shame tab |
| 35 | Savings goal: user picks and names it, one at a time, progress bar | Setup, Rules, Home |

## Reminders
| # | Requirement | Where |
|---|---|---|
| 36 | Evening "log it" nudge + weekly review reminder | Web Push via Cloudflare Worker (worker.js) |
| 37 | Free; server stores only reminder time + push address, no money data | worker.js |
| 38 | iOS 16.4+ required | README |

## Design
| # | Requirement | Where |
|---|---|---|
| 39 | Not overwhelming; 4 screens: Home, Spend, Wall of Shame, Settings | tab bar |
| 40 | Home = big number, Spend button, small streak, nothing else | Home (extra cards only appear when there's something to act on) |
| 41 | No gradients, glassmorphism, emoji cards, dashboards, pie charts | CSS |
| 42 | Number reacts: calm → red/harsher → angry when negative | mood classes |
| 43 | One typeface, black or off-white, one red accent; receipt that judges you | CSS tokens |
| 44 | First-run setup ≈ 60 seconds | Setup wizard |
| 45 | Backup to Files/iCloud export button (+ import) | Rules |

## Explicitly cut in the brainstorm (not built, by agreement)
- Separate trigger tags (patterns come from need/want/regret + category + time)
- SMS parsing (iPhone doesn't allow it)
- No-spend day challenges
