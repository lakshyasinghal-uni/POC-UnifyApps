# When something fails

- An agent stops without its output file: start a fresh one with the same message file and
  `Last attempt: <what the reply said>`. Twice, then carry on without it and log the gap.
- `fast brief` refuses twice after the Designer's fix: fix with the nearest passing value,
  log `MODERATOR`, go on.
- Nebula's plan fails a task twice: it skips the dependents; Rehearsal still walks what
  exists, and the runbook names the gap. Do not retry the plan a third time.
- The tenant is unreachable: Nebula says so; stop and tell the person in one line.
- The Code tab is missing on the tenant: the code app is unverified; the Nebula app, the
  prompt and the design system are still delivered.
- The Critic finds the code app still `fix` after two rounds: publish what exists, list the
  remaining findings in the runbook as unverified, and link the design system's style guide so a
  person can finish by hand.
