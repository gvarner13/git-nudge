import { Hono } from "hono";
import { Resend } from "resend";

type Bindings = {
  RESEND_TOKEN: string;
  GITHUB_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const resend = new Resend(c.env.RESEND_TOKEN);
  const token = c.env.GITHUB_TOKEN;
  const username = "gvarner13";
  // Calculate the start and end dates of the current week
  const currentDate = new Date();
  const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
  const lastDayOfWeek = firstDayOfWeek + 6;
  const startOfWeek = new Date(currentDate.setDate(firstDayOfWeek));
  const endOfWeek = new Date(currentDate.setDate(lastDayOfWeek));

  const gitDays = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  const query = `
       query {
         user(login: "${username}") {
           contributionsCollection(from: "${startOfWeek.toISOString()}", to: "${endOfWeek.toISOString()}") {
             contributionCalendar {
               totalContributions
               weeks {
                 contributionDays {
                   date
                   weekday
                   contributionCount
                 }
               }
             }
           }
         }
       }
     `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${token}`,
        "User-Agent": username,
      },
      body: JSON.stringify({ query }),
    });

    const gitData: JSON = await response.json();
    const totalContributions =
      gitData.data.user.contributionsCollection.contributionCalendar
        .totalContributions;

    const dayWithMaxContributions =
      gitData.data.user.contributionsCollection.contributionCalendar.weeks.reduce(
        (maxDay, week) => {
          return week.contributionDays.reduce((maxDay, day) => {
            return day.contributionCount > maxDay.contributionCount
              ? day
              : maxDay;
          }, maxDay);
        },
        { contributionCount: -1 }
      );

    console.log(dayWithMaxContributions);

    const { data, error } = await resend.emails.send({
      from: "Git Nudge <gitnudge@updates.garyvarner.me>",
      to: ["garysarahvarner@gmail.com"],
      subject: "Weekly Update",
      html: `You made <strong>${totalContributions}</strong> contributions this week 💪 and your best day was ${
        gitDays[dayWithMaxContributions.weekday]
      }.`,
    });
  } catch (error) {
    console.log(error);
  }

  // return c.json();
  return c.text("Sup!");
});

export default app;
