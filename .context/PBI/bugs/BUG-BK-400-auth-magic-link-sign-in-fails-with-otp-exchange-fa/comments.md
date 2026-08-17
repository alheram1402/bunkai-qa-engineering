# Comments for BK-400

[View in Jira](https://jira.upexgalaxy.com/browse/BK-400)

---

### Automation for Jira - 8/12/2026, 2:33:18 AM

✅ Pull Request is successfully MERGED and DEPLOYED on QA. 
It's Ready for Testing Phase! 
Dev Task is Done.

---

### Ely - 8/12/2026, 2:39:59 AM

## AI Tech Lead — Fix shipped to staging, verified live, with one activation step pending

PR [#160](https://github.com/upex-galaxy/upex-bunkai-tms/pull/160) merged as `70af01f`, verified an ancestor of `origin/staging` after an independent fetch, and deployed.

### Verified on deployed staging, not just in tests

The stateless rail was exercised against the live staging deployment with a real GoTrue token and ***no cookies present at all*** — the exact cross-device condition:

```
token*hash prefix: fc894da688   (a pkce* prefix here would mean unverifiable)
status  : 307
location: https://staging-upexbunkai.vercel.app/projects
auth cookie issued: true
```

That is sign-in completing on a request that carries nothing from the browser that asked for the link. Under the old rail the identical request produced `otp*exchange*failed`.

### The silent failure is gone

`/login?error=magic*link*invalid` now renders **"That sign-in link no longer works — Links expire quickly and can only be used once. Request a new one."** Previously the user got a bare login page and a raw SDK stack-trace in the address bar.

### :warning: Activation still pending — two changes that must land together

This PR is deliberately ***additive****: it builds the rail and makes failures visible, but traffic is still on the PKCE link, so ****the cross-device case is still broken in production today***. Switching it over takes two changes that are useless apart and harmful alone:

1. The magic-link sender becomes non-PKCE (`flowType: 'implicit'`).
2. The Supabase magic-link email template links to exactly:

   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink`

Why they are atomic, both verified rather than assumed:

- Under PKCE, GoTrue stores the token with a literal `pkce*`*** prefix*** (confirmed by querying `auth.one*time_tokens`), and `verifyOtp` will not accept it — so the template flip alone mails a hash that cannot verify.
- An implicit-flow sender under the ***current**** template makes GoTrue return the session in the URL ****fragment****, which a server route can never read — so the sender flip alone breaks sign-in on **every* device, including the one that works today.

`&` not `?` because `emailRedirectTo` already carries `?next=`; `.RedirectTo` not `.SiteURL` because `site_url` is pinned to `http://localhost:3000` while one Supabase project backs local, staging and production.

***The email template is shared by every environment, so step 2 must not happen until this code is live in production.*** Sequence: promote `staging` → `main`, then apply 1 and 2 together.

### Residual risk, recorded rather than silently accepted

Stateless verification removes an accidental guard. Someone holding a valid magic link for ***their own*** account can get a victim to click it and sign the victim's browser into the attacker's account, so the victim's subsequent work lands in the attacker's workspace. Under PKCE this was structurally impossible cross-browser only because the verifier cookie was missing — an accident, not a control.

Mitigation is a **"Continue as &lt;email&gt;?"** interstitial on the callback. That is a product/UX decision, not part of this fix, and it is the one thing worth deciding before the activation step above.

### Regression coverage

`app/auth/callback/route.test.ts` — 11 assertions. The cookie shim starts empty **and records writes**, so the passing case proves a real auth cookie was issued rather than merely that the redirect looked right. Covers replay of a spent token, a forged hash, rejection of `signup` / `recovery` / `invite` / `email*change` with the token proven still spendable, an expired link arriving as `?error=access*denied`, and an off-site `next`.

Also added `"test": "bun test"` to `package.json` — there was no test script, so nothing in the repo ran any test file.

### Full auth re-test (staging, UI + API)

| Flow | UI | API |
| --- | --- | --- |
| Create account with email + password | :white*check*mark: code field present, verified, signed in | :white*check*mark: `202 pending_confirmation` |
| Confirm code | :white*check*mark: | :white*check*mark: `200` + session + PAT |
| Password sign-in | :white*check*mark: | :white*check*mark: `200` + session + PAT |
| `check-email` probe | n/a | :white*check*mark: `{exists:true, confirmed:true}` |
| Magic link — request | :white*check*mark: "Check your inbox", mail in ~15s | :white*check*mark: `200 {ok:true}` |
| Magic link — same browser | :white*check*mark: signs in | n/a |
| Magic link — other device | :x: ***still broken until activation***, but now explains itself | n/a |
| Magic link — `token*hash` rail | n/a | :white*check_mark: signs in with zero cookies |
| GitHub OAuth | :white*check*mark: reaches GitHub consent | :white*check*mark: `307` + PKCE challenge |
| Google OAuth | :white*check*mark: reaches Google consent | :white*check*mark: `307` + PKCE challenge |

### Two configuration defects found and fixed while testing

- `rate*limit*email_sent`*** was ****`2` — project-wide, per hour. The whole product could send two auth emails an hour, and signup returned `429 email rate limit exceeded` under trivial test load. Raised to ****30*** (Supabase's own default for custom SMTP) and read back to confirm.
- ***The confirmation email said "6-digit code" while ****`mailer*otp*length`**** is ****`8`, so it delivered 8 digits. Template corrected via the Management API and the new content read back. ****Not yet visible in delivered mail*** — two signups two minutes apart still rendered the old copy, which points to GoTrue caching the template. Worth re-checking rather than assuming it took.

### Separate ticket

BK-401 — two `bunkai*search*atcs` isolation assertions fail on `staging` (a member does not find their own ATC). Found while running the full suite; confirmed pre-existing by re-running with these changes stashed. Unrelated to auth.

---

Posted by the AI Tech Lead profile under CLAUDE.md Critical Rule #18. No human sign-off is implied.

---


_Synced from Jira by sync-jira-issues_
