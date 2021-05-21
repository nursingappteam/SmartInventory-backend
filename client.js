console.log("hiyya");

const axios = require("axios");

axios.get("https://hello-sqlite-revamp.glitch.me/getDreams").then(response => {
    console.log(response.data);
  })
  .catch(error => console.error(error));
