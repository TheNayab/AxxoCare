var GoogleStrategy = require("passport-google-oauth20").Strategy;

const passport = async (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:
          "877897340523-nr870o21dhn7ntt0l2pgthvi38bb4div.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "https://localhost:4000/api/v1/auth/google/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        await console.log("Trying to connect", profile);
      }
    )
  );
};

module.exports = passport;
