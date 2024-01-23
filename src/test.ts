const fetchGitHubContributions = async () => {
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

  const data = await response.json();
  return data;
};

fetchGitHubContributions().then((data) =>
  console.log(data.data.user.contributionsCollection)
);
