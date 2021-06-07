# Hello SQLite!

This project includes a [Node.js](https://nodejs.org/en/about/) server script that uses a persistent [SQLite](https://www.sqlite.org) database. The app also includes a front-end with two web pages that connect to the database using the server API. 📊

The home page presents the user with a poll where they can choose an option, then the page presents the results in a chart. The admin page displays the log of past choices and allows the user to clear it by supplying their admin key (you can set this up next). 🔒

Check out the __Next steps__ to add a link that allows the user to view the results without casting a vote.

## What's in this project?

← `README.md`: That’s this file, where you can tell people what your cool website does and how you built it.

← `package.json`: The NPM packages for your project's dependencies.

← `.env`: The environment is cleared when you initially remix the project, but you will add a new env variable value when you follow the __Next steps__ to set up an admin key.

### Server and database

← `server.js`: The Node.js server script for your new site. The JavaScript defines the endpoints in the site API. The API processes requests, connects to the database using the `sqlite` script in `src`, and sends info back to the client (the web pages that make up the app user interface, built using the Handlebars templates in `src/pages`).

← `/src/sqlite.js`: The database script handles setting up and connecting to the SQLite database. The `server.js` API endpoints call the functions in the database script to manage the data.

← `/src/data-config.json`: The data config file includes the database manager script–`server.js` reads the `database` property to import the correct script.

When the app runs, the scripts build the database:

← `.data/choices.db`: Your database is created and placed in the `.data` folder, a hidden directory whose contents aren’t copied when a project is remixed. You can see the contents of `.data` in the console by selecting __Tools__ >  __Logs__.

> ___Want to use the server script as an API without using the front-end UI? No problem! Just send a query parameter `raw=true` with your requests, like this :`glitch-hello-sqlite.glitch.me?raw=true`___

### User interface

← `public/style.css`: The style rules that define the site appearance.

← `src/pages`: The handlebars files that make up the site user interface. The API in `server.js` sends data to these templates to include in the HTML.

← `src/pages/index.hbs`: The site homepage presents a form when the user first visits. When the visitor submits a preference through the form, the app calls the `POST` endpoint `/`, passing the user selection. The `server.js` endpoint updates the database and returns the user choices submitted so far, which the page presents in a chart (using [Chart.js](https://www.chartjs.org/docs/)–you can see the code in the page `head`);

← `src/pages/admin.hbs`: The admin page presents a table displaying the log of most recent picks. You can clear the list by setting up your admin key in __Next steps__ below. If the user attempts to clear the list without a valid key, the page will present the log again.

← `src/seo.json`: When you're ready to share your new site or add a custom domain, change SEO/meta settings in here.

## Setting up your admin key

The site __Admin__ page allows the user to clear the database of votes–but only if a valid key is provided. This is a simplified example of auth that checks if the user entered key matches the one in the `.env`.

To set your app up to allow clearing the history:

* In your `.env` file, find the variable named `ADMIN_KEY` and give it a text string as a value.
* With the __Admin__ page open in the preview, enter the same value and hit the __Clear log history__ button–this time it should allow you to clear the history.

See the `reset` endpoint in `server.js` to learn how this works.

## Next steps 🚀

Follow the steps to allow the user to view the results without first submitting a vote:

The homepage shows votes cast so far when the user completes the poll, but you can allow them to see the chart straight away.

1. Add a link to `src/pages/index.hbs` after the form, which will send a query parameter to the server script:

```
<p>
 <a href="/?results=true">Show results</a>
</p>
```

2. Extend the `server.js` `GET` endpoint `/` to send a flag if the user requested the results:

```
// User requested results
params.results = request.query.results;
```

Click the __Show results__ button to see the results without voting!

![Glitch](https://cdn.glitch.com/a9975ea6-8949-4bab-addb-8a95021dc2da%2FLogo_Color.svg?v=1602781328576)

## You built this with Glitch!

[Glitch](https://glitch.com) is a friendly community where millions of people come together to build web apps and websites.

- Need more help? [Check out our Help Center](https://help.glitch.com/) for answers to any common questions.
- Ready to make it official? [Become a paid Glitch member](https://glitch.com/pricing) to boost your app with private sharing, more storage and memory, domains and more.
