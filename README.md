# Hello SQLite!

This project includes a [Node.js](https://nodejs.org/en/about/) server script that uses a persistent [SQLite](https://www.sqlite.org) database. The app also includes a front-end web page that connects to the database. The user can see the current data and submit new records to the database. 📊

## What's in this project?

← `README.md`: That’s this file, where you can tell people what your cool website does and how you built it.

← `server.js`: The Node.js server script for your new site. The JavaScript defines the endpoints in the site back-end. This API processes requests, manipulates the data in the database, and sends info back to the client (the web page built using the Handlebars files in `src/pages`).

← `public/style.css`: The style rules that define the site appearance. These include class rules that will be applied when the user selects a theme, with the `hbs` page writing the chosen classes into the page.

← `src/pages`: The handlebars files that make up the site front-end. The API in `server.js` sends data to these to update the UI.

← `src/seo.json`: When you're ready to share your new site or add a custom domain, change SEO/meta settings in here.

← `package.json`: The NPM packages for your project's dependencies.

← `.env`: The environment is cleared when you initially remix the project, but you will add a new env variable when you follow the __Next steps__ to `POST` some data.

When the app runs Glitch builds the database:

← `themedata.db`: Your database is created by `server.js` and placed in the `.data` folder, a hidden directory whose contents aren’t copied when a project is remixed. You can see the contents of `.data` in the console by selecting __Tools__ >  __Logs__.

## Next steps

_tbd - add auth key and post_

![Glitch](https://cdn.glitch.com/a9975ea6-8949-4bab-addb-8a95021dc2da%2FLogo_Color.svg?v=1602781328576)

## You built this with Glitch!

[Glitch](https://glitch.com) is a friendly community where millions of people come together to build web apps and websites.

- Need more help? [Check out our Help Center](https://help.glitch.com/) for answers to any common questions.
- Ready to make it official? [Become a paid Glitch member](https://glitch.com/pricing) to boost your app with private sharing, more storage and memory, domains and more.
