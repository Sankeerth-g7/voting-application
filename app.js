const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { Admin, Elections } = require("./models");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const connectEnsureLogin = require("connect-ensure-login");
const saltRounds = 10;
const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(cookieParser("Some secret info"));
app.use(csrf("qwerftgyhujikxdctfvygbuhinzsrxdc", ["DELETE", "PUT", "POST"]));
app.use(
  session({
    secret: "Some secret info",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log("Authenticating User", email, password);
      Admin.findOne({ where: { email: email } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password 🤯" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Invalid email or You are not Registerd with Us.",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing User in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log("Deserializing User from session", id);
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", (req, res) => {
  return res.status(200).json({
    name: "Voting App",
    success: true,
  });
});


//admin routes
// app.use("/admin", require("./routes/admin"));
app.get(
  "/admin/",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/index" }),
  (req, res) => {
    res.render("admin/admin", {
      title: "Admin Dashboard",
      csrfToken: req.csrfToken(),
    });
  }
);


app.get(
  "/admin/index",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/admin/" }),
  (req, res) => {
    res.render("admin/index", {
      title: "Admin Registration",
      csrfToken: req.csrfToken(),
    });
  }
);

app.get("/admin/signup", (req, res) => {
  res.render("admin/signup", {
    title: "Admin Signup",
    csrfToken: req.csrfToken(),
  });
});


app.post("/admin/signup", async (req, res) => {
  console.log("Signing up a new admin");
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  const newAdmin = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: hashedPassword,
    username: req.body.username,
  };
  console.log(newAdmin)
  try {
    const admin = await Admin.create(newAdmin);
    req.login(admin, (error) => {
      if (error) {
        // console.log(error);
        res.status(422).json(error);
      }
      res.redirect("/admin/");
    });
  } catch (error) {
    console.log(error)
    req.flash(
      "error",
      error.errors.map((error) => error.message)
    );
    console.log(error.errors.map((error) => error.message));
    res.redirect("/admin/signup");
  }
});

app.get("/admin/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    }
    res.redirect("/");
  });
});

app.get("/admin/login", (req, res) => {
  res.render("admin/login", {
    title: "Admin Login",
    csrfToken: req.csrfToken(),
  });
});

app.get("/admin/newelection", (req, res) => {
  res.render("admin/newelection", {
    title: "New Election",
    csrfToken: req.csrfToken(),
  });
});

app.post("/admin/newelection", async(req, res) => {
  console.log("Creating a new election");
  console.log(req.body)
  const newElection = {
    electionName: req.body.Electionname,
    customString: req.body.customString,
  };
  console.log(newElection)
  try {
    const election = await Elections.create(newElection);
    console.log(election)
    res.redirect("/admin/");
  } catch (error) {  
    console.log(error)
    req.flash(
      "error",
      error.errors.map((error) => error.message)
    );
    console.log(error.errors.map((error) => error.message));
    res.redirect("/admin/newelection");
  }
});

app.get("/admin/elections", async (req, res) => {
  const elections = await Elections.findAll();
  res.render("admin/manageelections", {
    title: "Elections",
    elections:elections,
    csrfToken: req.csrfToken(),
    });
  });

app.get("/admin/elections/:id/edit", async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  res.render("admin/edit", {
    title: "Edit Election",
    election:election,
    csrfToken: req.csrfToken(),
    });
  });


app.post(
  "/admin/session",
  passport.authenticate("local", {
    failureRedirect: "/admin/login",
    failureFlash: true,
  }),
  function (request, response) {
    // console.log(request.user);
    response.redirect("/admin/");
  }
)


module.exports = app;