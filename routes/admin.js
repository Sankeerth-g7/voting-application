const passport = require("passport");
const bcrypt = require("bcrypt");
const { ElectionAdmin } = require("../models");
const router = require("express").Router();
const connectEnsureLogin = require("connect-ensure-login");

const saltRounds = 10;

router.get(
  "/",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/index" }),
  (req, res) => {
    if (req.user) {
      res.render("admin/index", {
        title: "Admin Dashboard",
        csrfToken: req.csrfToken(),
      });
    } else {
      res.redirect("/admin/index");
    }
  }
);

router.get(
  "/index",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/admin/" }),
  (req, res) => {
    res.render("admin/index", {
      title: "Admin index",
      csrfToken: req.csrfToken(),
    });
  }
);
router.get("/signup", (req, res) => {
  res.render("admin/signup", {
    title: "Admin Signup",
    csrfToken: req.csrfToken(),
  });
});

router.post(
  "/index",
  passport.authenticate("local", {
    successRedirect: "/admin/",
    failureRedirect: "/admin/index",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/admin/");
  }
);

router.post("/signup", async (req, res) => {
  console.log("Signing up a new admin");
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  const newAdmin = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: hashedPassword,
    username: req.body.username,
  };
  try {
    const admin = await ElectionAdmin.create(newAdmin);
    req.login(admin, (error) => {
      if (error) {
        // console.log(error);
        res.status(422).json(error);
      }
      res.redirect("/admin/");
    });
  } catch (error) {
    req.flash(
      "error",
      error.errors.map((error) => error.message)
    );
    console.log(error.errors.map((error) => error.message));
    res.redirect("/admin/signup");
  }
});

router.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;