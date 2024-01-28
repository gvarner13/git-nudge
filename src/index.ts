import { Hono } from "hono";
import { Resend } from "resend";

type Bindings = {
  RESEND_TOKEN: string;
  GITHUB_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  // console.log(c.env.RESEND_TOKEN);
  const resend = new Resend(c.env.RESEND_TOKEN);
  const token = c.env.GITHUB_TOKEN;
  const username = "gvarner13";
  // Calculate the start and end dates of the current week
  const currentDate = new Date();
  const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
  const lastDayOfWeek = firstDayOfWeek + 6;
  const startOfWeek = new Date(currentDate.setDate(firstDayOfWeek));
  const endOfWeek = new Date(currentDate.setDate(lastDayOfWeek));

  const query = `
       query {
         user(login: "${username}") {
           contributionsCollection(from: "${startOfWeek.toISOString()}", to: "${endOfWeek.toISOString()}") {
             contributionCalendar {
               totalContributions
               weeks {
                 contributionDays {
                   date
                   contributionCount
                 }
               }
             }
           }
         }
       }
     `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const gitData: JSON = await response.json();
  const totalContributions =
    gitData.data.user.contributionsCollection.contributionCalendar
      .totalContributions;

  const { data, error } = await resend.emails.send({
    from: "Git Nudge <gitnudge@updates.garyvarner.me>",
    to: ["garysarahvarner@gmail.com"],
    subject: "Weekly Update",
    html: `You made <strong>${totalContributions}</strong> contributions this week 💪`,
  });

  // return c.json();
  return c.text("Sup!");
});

export default app;
