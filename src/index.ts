import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { startOfWeek, endOfWeek, subDays, formatISO } from "date-fns";

type Bindings = {
  RESEND_TOKEN: string;
  GITHUB_TOKEN: string;
  SUPABASE_KEY: string;
  SUPABASE_URL: string;
};

type GithubJSON = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<Object>;
        };
      };
    };
  };
};

const app = new Hono<{ Bindings: Bindings }>();

const authToken = "gitnudgeisdope";

app.use("*", bearerAuth({ token: authToken }));

app.get("/", async (c) => {
  const resend = new Resend(c.env.RESEND_TOKEN);
  const token = c.env.GITHUB_TOKEN;
  const username = "gvarner13";
  // Calculate the start and end dates of the current week
  const currentDate = new Date();
  const firstDayOfWeek = startOfWeek(currentDate);
  const lastDayOfWeek = subDays(endOfWeek(currentDate), 1);

  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseKey = c.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

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
           contributionsCollection(from: "${formatISO(
             firstDayOfWeek
           )}", to: "${formatISO(lastDayOfWeek)}") {
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

    const gitData = (await response.json()) as GithubJSON;

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

    const { data, error } = await resend.emails.send({
      from: "Git Nudge <gitnudge@updates.garyvarner.me>",
      to: ["garysarahvarner@gmail.com"],
      subject: "Weekly Update",
      html: `You made <strong>${totalContributions}</strong> contributions this week 💪 and your best day was ${
        gitDays[dayWithMaxContributions.weekday]
      }.`,
    });

    // const { count } = await supabase
    //   .from("waitlist")
    //   .select("*", { count: "exact", head: true });

    return c.text("Sup!");
  } catch (error) {
    console.log(error);
    return c.text("oops!");
  }
});

app.post("/nudge", async (c) => {
  //using this for adding users
  return c.text("Post coming soon");
});

export default app;
