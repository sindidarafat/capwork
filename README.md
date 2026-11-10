# CAP Task Board

The CAP team's task board as a website. Everyone signs in with their CAP Microsoft 365 work account and sees everything. Only admins and people marked "Can edit" can add or change anything.

## What's in it

| Page | What it does |
| --- | --- |
| Today | Every open task due within 2 days, overdue, without a deadline, or already moving, ranked by urgency. Editors change status straight from the list. Filter to one person or "Only my tasks". |
| Task Log | Every task ever logged, with search and filters. Nothing is deleted. Download as CSV. |
| Task page | All the details, an edit form for editors, and a history of every change: who, when, what. |
| Coming Up | Each person's tasks over the next six working days (Sunday to Thursday), load against capacity, and everything due in 14 days. |
| Scorecard | Delivered, on-time %, revisions, first-round approval and estimate accuracy per person, for any dates. |
| Clients & Pitches | Clients and prospects. Type (Client, Pitch, Internal) decides how their tasks are counted. |
| Team | Names, roles, capacity, work emails and who can edit. |

The rules match the Task Board handbook: same flags, same urgency score (1 to 7), same on-time rule. Changing a status also fills in the dates for you: Delivered on when work goes for review, Completed on when it's Done, and +1 revision when it moves to Revisions.

## Who can do what

| Person | Can |
| --- | --- |
| Admin (emails in the `ADMIN_EMAILS` setting) | Everything, including deciding who else can edit |
| Editor ("Can edit the board" ticked on the Team page) | Add and change tasks, clients and team details |
| Everyone else with a CAP Microsoft 365 account | See everything, change nothing |

People outside CAP's Microsoft 365 can't sign in at all.

---

# Setup guide

You need about an hour, a laptop and two people: you, and whoever manages CAP's Microsoft 365 (the person who can add new email accounts). Nothing needs installing. Everything happens in a web browser.

You'll create three free accounts along the way: GitHub (stores the code), Vercel (runs the website) and Neon (stores the data, set up from inside Vercel).

## Step 1. Put the code on GitHub

1. Go to github.com and sign up. Use a CAP email address.
2. Click the **+** at the top right, then **New repository**.
3. Name it `cap-task-board`, choose **Private**, and click **Create repository**.
4. On the next page, click the link **uploading an existing file**.
5. Unzip `cap-task-board.zip` on your computer. Open the folder, select **everything inside it** (not the folder itself) and drag it onto the GitHub page.
6. Wait for all the files to finish uploading, then click **Commit changes**.

## Step 2. Create the website on Vercel

1. Go to vercel.com and click **Sign Up**. Choose **Continue with GitHub** and allow access.
2. Click **Add New**, then **Project**. Find `cap-task-board` in the list and click **Import**.
3. Leave every setting as it is and click **Deploy**.
4. When it finishes, Vercel shows your site's address, something like `cap-task-board.vercel.app`. Write it down. Opening it now shows a "connect a database" message, which is expected.

## Step 3. Add the database

1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database**, choose **Neon** (Serverless Postgres), and follow the prompts. Pick the **Singapore** region, the closest to Dhaka.
3. When asked, connect it to the `cap-task-board` project.

Vercel adds the database setting (`DATABASE_URL`) for you. The first time the site loads, it builds the tables and copies in the current team, clients and seven tasks from the Google Sheet.

## Step 4. Register the site with Microsoft (Microsoft 365 admin)

The CAP Microsoft 365 admin does this step.

1. Go to entra.microsoft.com and sign in with the admin account.
2. Open **Applications**, then **App registrations**, then **New registration**.
3. Name: `CAP Task Board`. Supported account types: **Accounts in this organizational directory only**.
4. Redirect URI: choose **Web** and enter your site address followed by `/api/auth/callback/microsoft-entra-id`, for example:
   `https://cap-task-board.vercel.app/api/auth/callback/microsoft-entra-id`
5. Click **Register**. On the page that opens, copy two values:
   - **Application (client) ID**
   - **Directory (tenant) ID**
6. Open **Certificates & secrets**, then **New client secret**. Description `Task Board`, expiry **24 months**, then **Add**. Copy the **Value** straight away; it is only shown once.
7. Open **API permissions**. `User.Read` should already be listed. Click **Grant admin consent for CAP** and confirm.

Put a reminder in the calendar about three weeks before the secret expires (step 6). When it expires, sign-in stops until a new secret is added in Vercel.

## Step 5. Add the settings in Vercel

In your Vercel project, open **Settings**, then **Environment Variables**. Add each of these. Leave the environments ticked (Production, Preview, Development).

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | A long random value. Open https://generate-secret.vercel.app/32 and copy what it shows. |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | The Application (client) ID from step 4 |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | The client secret Value from step 4 |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | `https://login.microsoftonline.com/` + the Directory (tenant) ID + `/v2.0`, for example `https://login.microsoftonline.com/1a2b3c4d-1234-5678-9abc-def012345678/v2.0` |
| `ADMIN_EMAILS` | Muntasir's work email, plus one more if you want a backup admin, separated by a comma |
| `ALLOWED_EMAIL_DOMAINS` | Optional. CAP's email domain, for example `cap.com.bd` |

Then open the **Deployments** tab, click the **...** on the top deployment and choose **Redeploy**. Settings only take effect after a redeploy.

## Step 6. Sign in and finish the team list

1. Open your site address and click **Sign in with Microsoft**. Sign in as Muntasir. The top bar should say **Admin**.
2. Open **Team**. For each person, click **Edit**, add their work email and real daily capacity, and save. The email links a person's Microsoft sign-in to their tasks, so "Only my tasks" works for them.
3. For anyone else who should edit, tick **Can edit the board**. Only admins see that box.
4. Share the site address with the team. Anyone with a CAP Microsoft 365 account can sign in and view.

## Afterwards

- **Changing who can edit:** an admin ticks or unticks "Can edit the board" on the Team page. To change who is an admin, edit `ADMIN_EMAILS` in Vercel and redeploy.
- **Someone leaves:** untick **Active** on the Team page. Their history stays. Remove their account in Microsoft 365 as usual and they can no longer sign in.
- **Backups:** the Task Log has a **Download CSV** button. Download it at the end of each month and keep it in Drive or SharePoint.
- **Your own address:** in Vercel, **Settings**, then **Domains**, you can add something like `board.cap.com.bd`. If you do, add the new callback address to the Microsoft app registration too (step 4, Redirect URI).

## If something goes wrong

| What you see | What to check |
| --- | --- |
| "connect a database" message | Step 3: the Neon database is created and connected to this project, then redeploy |
| "Microsoft sign-in isn't switched on yet" | Step 5: all four AUTH settings are added, then redeploy |
| Microsoft says the redirect URI doesn't match | Step 4: the Redirect URI is your exact site address + `/api/auth/callback/microsoft-entra-id` |
| "That account can't sign in here" | The account isn't in CAP's Microsoft 365, or isn't on `ALLOWED_EMAIL_DOMAINS` |
| Someone is a Viewer but should edit | Their work email on the Team page must match their Microsoft sign-in exactly, and "Can edit" must be ticked |
| Sign-in suddenly stops for everyone | The Microsoft client secret has expired. Make a new one (step 4.6) and update `AUTH_MICROSOFT_ENTRA_ID_SECRET` |

## For a developer

Next.js 15 (App Router), Auth.js v5 with Microsoft Entra ID, PostgreSQL through `pg`. Tables are created and seeded on first connection (`lib/db.js`, `lib/seed.js`). Board rules live in `lib/board.js`. Styles are in `app/globals.css`.

To run it on your own machine: `npm install`, create `.env.local` from `.env.example` with a local `DATABASE_URL`, add `DEV_LOGIN=1` for a test login, then `npm run dev`. The test login can't switch on when the app runs on Vercel.
