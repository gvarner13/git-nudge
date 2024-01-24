import { Hono } from "hono";
import { Resend } from "resend";

const app = new Hono();

const resend = new Resend("re_123456789");

app.get("/", async (c) => {
  const token = "token-here"; // Replace with your token
  const query = `
      query {
        user(login: "gvarner13") {
          contributionsCollection {
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

  const gitData = await response.json();

  const { data, error } = await resend.emails.send({
    from: "Acme <gitnudge@updates.garyvarner.me>",
    to: ["garysarahvarner@gmail.com"],
    subject: "Hello World",
    html: "<strong>It works!</strong>",
  });

  return c.json(gitData);
  // return c.text('Hello Hono!')
});

export default app;
