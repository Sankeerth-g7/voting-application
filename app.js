const express = require("express");
const bodyParser = require("body-parser");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const {
  Voters,
  Question,
  choice,
  Elections,
  admin,
  Vote,
} = require("./models");

const saltRounds = 10;

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(cookieParser("Some secret info"));
app.use(flash());
app.use(
  session({
    secret: "this is sceret",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: true,
  })
);
app.use(csrf("UicgFjabMtvsSJEHUSfK3Dz0NR6K0pIm", ["DELETE", "PUT", "POST"]));

app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/election/:id([0-9]+)", async (req, res) => {
  // console.log(req.params.id)
  try {
    if (req.params.id) {
      const election = await Elections.findByPk(req.params.id);
      if (election && (election.ended || election.status)) {
        res.redirect("/voter");
      } else {
        res.json({
          message: " Not Found "
        })
      }
    } else {
      res.json({
        message: " Not Found "
      })
    }
  } catch {
    (error) => {
      console.log(error);
      res.json({
        message: " Not Found "
      })
    };
  }
});

app.get(
  "/election/:cstring([a-zA-z]+[0-9a-zA-Z]*(?:_[a-z0-9]+)*)",
  async (req, res) => {
    // console.log(req.params.cstring)
    try {
      if (req.params.cstring) {
        const election = await Elections.findOne({
          where: {
            urlString: req.params.cstring,
          },
        });
        if (election && (election.ended || election.status)) {
          res.redirect("/voter");
        } else {
          res.json({
            message: " Not Found"
          })
        }
      } else {
        res.json({
          message: " Not Found"
        })
      }
    } catch {
      (error) => {
        console.log(error);
        res.json({
          message: " Not Found"
        })
      };
    }
  }
);

passport.use(
  "adminAuth",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log("Authenticating User", email, password);
      admin.findOne({ where: { email: email } })
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
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  console.log(
    "Deserializing User from session",
    user.id,
    user.email || user.voterId
  );
  if (user.email && user.id) {
    const new_admin = await admin.findOne({
      where: { email: user.email, id: user.id },
    });
    done(null, new_admin);
  } else if (user.id && user.voterId) {
    const voter = await Voters.findOne({
      where: { voterId: user.voterId, id: user.id },
    });
    done(null, voter);
  } else {
    done("User Not Found", null);
  }
});

app.get("/admin", async (req, res) => {
  res.render("adminindex", {
    title: "Admin Dashboard",
    csrfToken: req.csrfToken(),
  });
});

app.get(
  "/admin/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/admin/create_election" }),
  (req, res) => {
    res.render("adminlogin", {
      title: "Admin Login",
      csrfToken: req.csrfToken(),
    });
  }
);

app.get(
  "/admin/signup",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/admin/create_election" }),
  (req, res) => {
    res.render("adminsignup", {
      title: "Admin Signup",
      csrfToken: req.csrfToken(),
    });
  }
);

app.post(
  "/admin/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/admin/create_election" }),
  passport.authenticate("adminAuth", {
    successRedirect: "/admin/create_election",
    failureRedirect: "/admin/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/admin/create_election");
  }
);

app.post(
  "/admin/signup",
  connectEnsureLogin.ensureLoggedOut("/admin/create_election"),
  async (req, res) => {
    console.log("Signing up a new admin");
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newAdmin = {
      email: req.body.email,
      password: hashedPassword,
      username: req.body.username,
    };
    try {
      const new_admin = await admin.create(newAdmin);
      req.login(new_admin, (error) => {
        if (error) {
          // console.log(error);
          res.status(422).json(error);
        }
        res.redirect("/admin/create_election");
      });
    } catch (error) {
      console.log(error);
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      console.log(error.errors.map((error) => error.message));
      res.redirect("/admin/signup");
    }
  }
);

app.get(
  "/admin/signout",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/create_election" }),
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        next(err);
      }
      console.log("User Logged Out");
      res.redirect("/");
    });
  }
);

app.get(
  "/admin/create_election",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    const liveElections = await Elections.getLiveElectionsofUser({
      userId: req.user.id,
    });
    const elections = await Elections.getElectionsofUser({ userId: req.user.id });
    if (req.accepts("html")) {
      res.render("Create_Elections", {
        title: "Create Election",
        liveElections,
        elections,
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({
        liveElections,
        elections,
      });
    }
  }
);

app.get(
  "/admin/election/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    // console.log(req.params.id);
    const electionId = req.params.id;
    const userId = req.user.id;
    const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
      electionId: electionId,
      userId: userId,
    });
    const voterCount = await Voters.getAllVotersofElection({
      electionId: electionId,
      userId: userId,
    });
    const questionCount = await Question.getAllQuestionsofElection({
      electionId: electionId,
      userId: userId,
    });
    try {
      if (doesElectionBelongToUser.success) {
        const election = await Elections.getElection({ electionId: electionId });
        console.log(election)
        res.render("election", {
          title: "Election " + election.electionName,
          election,
          voterCount: voterCount.length,
          questionCount: questionCount.length,
          csrfToken: req.csrfToken(),
        });
      } else {
        req.flash("error", doesElectionBelongToUser.message);
        res.redirect("/admin/create_election");
      }
    } catch (error) {
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      res.redirect("/admin/create_election");
    }
  }
);

app.post(
  "/admin/election",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    console.log("Creating a new election");
    const election = {
      electionName: req.body.name,
      urlString: req.body.Url_String,
      userId: req.user.id,
    };
    election.urlString =
      election.urlString === "" ? null : election.urlString;
    try {
      if (election.urlString !== null) {
        if (
          election.urlString.match(
            "^[a-zA-Z]+[a-z0-9A-Z]+(?:(?:-|_)+[a-z0-9A-Z]+)*$"
          )
        ) {
          await Elections.createElection(election);
          res.redirect("/admin/create_election");
        } else {
          req.flash(
            "error",
            "Custom string should only contain alphanumeric characters and should start with a letter"
          );
          res.redirect("/admin/create_election");
        }
      } else {
        await Elections.createElection(election);
        res.redirect("/admin/create_election");
      }
    } catch (error) {
      console.log(error);
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      console.log(error.errors.map((error) => error.message));
      res.redirect("/admin/create_election");
    }
  }
);

app.delete(
  "/admin/create_election/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    console.log("Deleting election");
    const electionId = req.params.id;
    const userId = req.user.id;
    const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
      electionId: electionId,
      userId: userId,
    });
    try {
      if (doesElectionBelongToUser.success) {
        await Elections.deleteElection({ electionId: electionId });
        return res.status(200).json({
          success: true,
        });
      } else {
        res.status(401).json({
          success: false,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
      });
    }
  }
);

app.get(
  "/admin/election/voters/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    const electionId = req.params.id;
    const userId = req.user.id;
    try {
      const isUserElection = await Elections.isElectionbelongstoUser({
        electionId,
        userId,
      });
      if (isUserElection.success) {
        const voters = await Voters.getAllVotersofElection({
          electionId,
          userId,
        });
        if (req.accepts("html")) {
          try {
            res.render("voters", {
              title: "Admin Dashboard",
              voters,
              electionId: electionId,
              election: isUserElection,
              csrfToken: req.csrfToken(),
            });
          } catch (error) {
            console.log(error);
            res.status(500).json(error);
          }
        } else {
          res.json({
            voters,
            electionId,
          });
        }
      } else {
        req.flash("error", isUserElection.message);
        res.redirect("/admin/create_election");
      }
    } catch {
      (error) => {
        console.log(error);
        req.flash(
          "error",
          `Something went wrong, Pls try again later ${error}`
        );
        res.redirect("/admin/create_election");
      };
    }
  }
);

app.post(
  "/admin/election/voters",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    console.log(req.body);
    const electionId = req.body.electionId;
    const userId = req.user.id;
    const voter = {
      voterId: req.body.voterID,
      password: req.body.password,
      votername: req.body.votername,
      electionId: req.body.electionId,
    };
    console.log(voter);
    try {
      const isUserElection = await Elections.isElectionbelongstoUser({
        electionId,
        userId,
      });
      if (isUserElection.success && !isUserElection.ended) {
        try {
          // console.log(voter)
          await Voters.createVoter(voter);
          res.redirect(`/admin/election/voters/${electionId}`);
        } catch (error) {
          console.log(error);
          req.flash(
            "error",
            error.errors.map((error) => error.message)
          );
          res.redirect("/admin/election/voters/" + electionId);
        }
      } else {
        console.log("Unauthorized Access");
        req.flash(
          "error",
          isUserElection.ended ? "Election Ended" : "Unauthorized Access"
        );
        res.redirect("/admin/create_election");
      }
    } catch (error) {
      console.log(error);
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      console.log("Redirecting to /admin/create_election");
      res.redirect("/admin/create_election/voters/" + electionId);
    }
  }
);

app.delete(
  "/admin/election/voters/:electionId/:voterId",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin/" }),
  async (req, res) => {
    const voterId = req.params.voterId;
    const electionId = req.params.electionId;
    const userId = req.user.id;
    const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
      electionId,
      userId,
    });
    try {
      if (doesElectionBelongToUser.success) {
        const voter = await Voters.findByPk(voterId);
        if (voter) {
          await Voters.remove(voter.id, electionId);
          return res.status(200).json({
            success: true,
          });
        } else {
          res.status(404).json({
            success: false,
          });
        }
      } else {
        res.status(401).json({
          success: false,
        });
      }
    } catch (error) {
      console.log(error);
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      res.redirect("/admin/election/voters");
    }
  }
);

app.get(
  "/admin/election/questions/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }),
  async (req, res) => {
    console.log("Question Route accessed");
    const electionId = req.params.id;
    const userId = req.user.id;
    try {
      const isUserElection = await Elections.isElectionbelongstoUser({
        electionId: electionId,
        userId,
      });
      console.log(isUserElection);
      if (isUserElection.success && !isUserElection.status) {
        console.log(isUserElection);
        const questions = await Question.getAllQuestionsofElection({
          electionId: electionId,
          userId,
        });
        console.log(questions);
        for (let i = 0; i < questions.length; i++) {
          console.log("fetching choices");
          questions[i].choice = await choice.getAllchoicesOfQuestion({
            questionId: questions[i].id,
            // userId,
          });
          console.log(questions[i].choice);
        }
        if (req.accepts("html")) {
          res.render("questions", {
            title: `Questions of Election ${electionId}`,
            csrfToken: req.csrfToken(),
            questions,
            election: isUserElection,
            electionId: electionId,
          });
        } else {
          res.json({
            questions,
            electionId,
          });
        }
      } else {
        req.flash("error", isUserElection.message);
        res.redirect("/admin/create_election");
      }
    } catch {
      (err) => {
        console.log(err);
        req.flash("error", `Something went wrong, Pls try again later ${err}`);
        res.redirect("/admin/create_election");
      };
    }
  }
);

app.post("/admin/election/questions", async (req, res) => {
  console.log(req.body);
  const electionId = req.body.electionId;
  const userId = req.user.id;
  const question = {
    title: req.body.title,
    desc: req.body.desc,
    electionId: req.body.electionId,
  };
  const given_choices = req.body.choices;
  try {
    const isUserElection = await Elections.isElectionbelongstoUser({
      electionId: electionId,
      userId,
    });
    if (isUserElection.success && !isUserElection.ended) {
      if (!isUserElection.status) {
        try {
          const newQuestion = await Question.createQuestion(question);
          for (let i = 0; i < given_choices.length; i++) {
            console.log(given_choices)
            await choice.createchoice({
              desc: given_choices[i],
              questionId: newQuestion.id,
            });
          }
          req.flash("success", "Question Added Successfully");
          res.redirect(`/admin/election/questions/${electionId}`);
        } catch {
          (error) => {
            console.log(error);
            req.flash(
              "error",
              error.errors.map((error) => error.message)
            );
            res.redirect(`/admin/election/quesitons/${electionId}`);
          };
        }
      } else {
        console.log("Election is already live");
        req.flash("error", "Election is already live");
        res.redirect(`/admin/election/questions/${electionId}`);
      }
    } else {
      console.log("Unauthorized Access");
      req.flash(
        "error",
        isUserElection.ended ? "Election Ended" : "Unauthorized Access"
      );
      res.redirect("/admin/create_election");
    }
  } catch {
    (error) => {
      console.log(error);
      req.flash(
        "error",
        error.errors.map((error) => error.message)
      );
      res.redirect(`/admin/create_election`);
    };
  }
});

app.delete(
  "/admin/election/question/:id/:questionId",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }),
  async (req, res) => {
    console.log("Delete Question Route Accessed");
    const electionId = req.params.id;
    const userId = req.user.id;
    const questionId = req.params.questionId;
    const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
      electionId: electionId,
      userId: userId,
    });
    try {
      if (doesElectionBelongToUser.success) {
        await Question.deleteQuestion({ questionId:questionId, electionId });
        return res.status(200).json({
          success: true,
        });
      } else {
        res.status(401).json({
          success: false,
        });
      }
    } catch {
      (error) => {
        console.log(error);
        res.status(500).json({
          success: false,
        });
      };
    }
  }
);

app.put(
  "/admin/election/launch/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }),
  async (req, res) => {
    console.log("Launch Election Route Accessed");
    const electionId = req.params.id;
    const userId = req.user.id;
    try {
      const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
        electionId: electionId,
        userId: userId,
      });
      if (
        doesElectionBelongToUser.success &&
        !doesElectionBelongToUser.status &&
        !doesElectionBelongToUser.ended
      ) {
        const questionCount = await Question.getAllQuestionsofElection({
          electionId: electionId,
          userId: userId,
        });
        if (questionCount.length >= 1) {
          await Elections.launchElection({ electionId: electionId, userId: userId });
          res.json({
            success: true,
          });
        } else {
          res.json({
            success: false,
            message: "Election must have atleast 1 question to launch Election",
          });
        }
      } else {
        res.status(401).json({
          success: false,
          ended: doesElectionBelongToUser.ended,
        });
      }
    } catch {
      (error) => {
        console.log(error);
        res.status(500).json({
          success: false,
        });
      };
    }
  }
);

app.put(
  "/admin/election/stop/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }),
  async (req, res) => {
    const electionId = req.params.id;
    const userId = req.user.id;
    try {
      const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
        electionId: electionId,
        userId: userId,
      });
      console.log(doesElectionBelongToUser);
      if (
        doesElectionBelongToUser.success &&
        doesElectionBelongToUser.status &&
        !doesElectionBelongToUser.ended
      ) {
        await Elections.endElection({ electionId: electionId, userId: userId });
        res.json({
          success: true,
        });
      } else {
        res.json({
          success: false,
          message: doesElectionBelongToUser.ended
            ? "Election is already Ended"
            : "Election is not live",
        });
      }
    } catch {
      (error) => {
        console.log(error);
        res.status(500).json({
          success: false,
        });
      };
    }
  }
);

app.get(
  "/admin/election/result/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }),
  async (req, res) => {
    const electionId = req.params.id;
    const userId = req.user.id;
    try {
      const doesElectionBelongToUser = await Elections.isElectionbelongstoUser({
        electionId: electionId,
        userId: userId,
      });
      if (doesElectionBelongToUser.success) {
        const questions = await Question.getAllQuestionsofElection({
          electionId: electionId,
          userId: userId,
        });
        let result = [];
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const choice = await cOptions({
            questionId: question.id,
          });
          let choiceResult = [];
          let count = 0;
          for (let j = 0; j < choice.length; j++) {
            const choice = choice[j];
            const votes = await Vote.getVotesOfOption({ choiceId: choice.id });
            count += votes.length;
            choiceResult.push({
              choice: choice,
              votes: votes.length,
            });
          }
          result.push({
            votes: count,
            question: question,
            choice: choiceResult,
          });
        }
        res.render("result", {
          electionId: electionId,
          results: result,
          title: "Election Result",
          csrfToken: req.csrfToken(),
        });
      } else {
        req.flash("error", "Unauthorized Access");
        res.redirect("/admin/create_election");
      }
    } catch {
      (error) => {
        console.log(error);
      };
    }
  }
);
passport.use(
  "voterAuth",
  new LocalStrategy(
    {
      usernameField: "voterID",
      passwordField: "password",
    },
    async (voterID, password, done) => {
      // console.log("Authenticating User", voterID, password);
      Voters.findOne({ where: { voterId: voterID } })
        .then(async (user) => {
          // console.log("checking Password", user.password === password)
          const result = password === user.password;
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((err) => {
          console.log(err);
          return done(null, false, {
            message: "Invalid VoterID or You are not Registered with Us.",
          });
        });
    }
  )
);

app.get(
  "/voter",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/voter/election" }),
  (req, res) => {
    res.render("voterindex", {
      title: "Voter Dashboard",
      csrfToken: req.csrfToken(),
    });
  }
);

app.get(
  "/voter/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/voter/election" }),
  (req, res) => {
    res.render("voterlogin", {
      title: "Voter Login",
      csrfToken: req.csrfToken(),
    });
  }
);

app.post(
  "/voter/login",
  connectEnsureLogin.ensureLoggedOut({ redirectTo: "/voter/election" }),
  passport.authenticate("voterAuth", {
    // successRedirect: "/voter/election",
    failureRedirect: "/voter/login",
    failureFlash: true,
  }),
  (req, res) => {
    console.log("Redirecting to Election Page");
    res.redirect("/voter/election");
  }
);

app.get(
  "voter/logout",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/voter" }),
  async (req, res) => {
    req.logout((err) => {
      if (err) {
        console.log(err);
      }
      req.flash("success", "Logged Out Successfully");
      res.redirect("/");
    });
  }
);

app.get(
  "/voter/election",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/voter/login" }),
  async (req, res) => {
    const electionId = req.user.electionId;
    if (electionId == null) {
      console.log("No Election Assigned");
      req.logout((err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/voter");
      });
    } else {
      const live = await Elections.isElectionLive({ electionId });
      if (live.success) {
        const questions = await Question.getQuesionsOfElection({ electionId: electionId });
        const hasVoted = await Vote.hasVoted({
          voterId: req.user.id,
          questionId: questions[0].id,
        });
        if (hasVoted && !live.ended) {
          console.log("Already Voted");
          res.render("alreadyVoted", {
            title: `Voting Election ${electionId}`,
            electionId: electionId,
            ended: live.ended,
            csrfToken: req.csrfToken(),
          });
        } else {
          console.log("Voting");
          for (let i = 0; i < questions.length; i++) {
            questions[i].choice = await choice.getAllchoicesOfQuestion({
              questionId: questions[i].id,
            });
          }
          res.render("VoteElection", {
            title: `Voting Election ${electionId}`,
            electionId: electionId,
            questions: questions,
            ended: live.ended,
            csrfToken: req.csrfToken(),
          });
        }
      } else if (live.ended) {
        console.log("Election Ended");
        const questions = await Question.getQuesionsOfElection({ electionId: electionId });
        let result = [];
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const choice = await cOptions({
            questionId: question.id,
          });
          let choiceResult = [];
          let count = 0;
          for (let j = 0; j < choice.length; j++) {
            const choice = choice[j];
            const votes = await Vote.getVotesOfChoice({ choiceId: choice.id });
            count += votes.length;
            choiceResult.push({
              choice: choice,
              votes: votes.length,
            });
          }
          result.push({
            votes: count,
            question: question,
            choice: choiceResult,
          });
        }
        res.render("alreadyVoted", {
          title: `Voting Election ${electionId}`,
          electionId: electionId,
          ended: live.ended,
          csrfToken: req.csrfToken(),
          results: result,
        });
      } else {
        req.logout((err) => {
          if (err) {
            console.log(err);
          }
          req.flash("error", live.message);
          res.redirect("/voter");
        });
      }
    }
  }
);

app.get("/admin/my_elections", connectEnsureLogin.ensureLoggedIn({ redirectTo: "/admin" }), async(req,res) =>{
  const elections = await Elections.getElectionsofUser({ userId: req.user.id });
  const liveElections = await Elections.getLiveElectionsofUser({ userId: req.user.id });
  res.render("my_elections", {
    elections: elections,
    liveElections: liveElections,
  })
})

app.post("/voter/election", async (req, res) => {
  try {
    let questionVoted = [];
    if (typeof req.body.questions == "string") {
      questionVoted.push(req.body.questions);
    } else {
      questionVoted = req.body.questions;
    }
    const choice = [];
    for (let i = 0; i < questionVoted.length; i++) {
      choice.push(req.body[`choice${i}`]);
    }
    if (questionVoted.length != choice.length) {
      req.flash("error", "There was Some Issue, Please try Again !!!");
      res.redirect("/voter/election");
    } else {
      let checkChoiceBelongsToQuestion = true;
      for (let i = 0; i < questionVoted.length; i++) {
        checkChoiceBelongsToQuestion = (await choice.doesOptionBelongToQuestion(
          {questionId: questionVoted[i], choiceId: choice[i] }
        ))
          ? checkChoiceBelongsToQuestion
          : false;
      }
      // console.log("Hello Something is Wrong", checkChoiceBelongsToQuestion)
      if (checkChoiceBelongsToQuestion) {
        // console.log(questionVoted, choice, req.user.id)
        for (let i = 0; i < questionVoted.length; i++) {
          // console.log(questionVoted[i], choice[i], req.user.id)
          let newVote = await Vote.createVote({
            questionId: questionVoted[i],
            choiceId: choice[i],
            voterId: req.user.id,
          });
          if (newVote == null) {
            req.flash("error", "There was Some Issue, Please try Again !!!");
            res.redirect("/voter/election");
          }
        }
        req.flash("success", "Voted Successfully");
        res.redirect("/voter/election");
      } else {
        req.flash("error", "There was Some Issue, Please try Again !!!");
        res.redirect("/voter/election");
      }
    }
  } catch {
    (err) => {
      console.log(err);
      req.flash("error", "There was Some Issue, Please try Again !!!");
      res.redirect("/voter/election");
    };
  }
});


module.exports = app;