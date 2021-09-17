module.exports = {
  cookieSecret: "secret_key_travell_partner",
  gmail: {
    user: "",
    password: "",
  },
  mongo: {
    development: {
      connectionString:
        "mongodb+srv://admin:admin@cluster0.39ic9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    },
    production: {
      connectionString: "",
    },
  },
};
