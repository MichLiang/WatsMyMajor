const UsersRouter = require('express').Router();
const { setCourseListPrereqs, setCoursesPrereqs } = require('../core/utils');
const auth = require('../core/auth');
const parseSchedule = require('../core/parsers/scheduleParser');
const users = require('../core/users');
const images = require('../database/images');
const facebookUsers = require('../database/facebookUsers');

// TODO: Find a better way to enforce lower case for username

// Get user
UsersRouter.get('/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const { user, err } = await users.getUser(username);
  if (err) {
    console.error(err);
    res.status(400).send(err);
  } else res.json(user);
});

// Link facebook id to user
UsersRouter.post('/link/facebook/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  const { facebookID, hasFBPic } = req.body;
  if (req.user !== username) return res.sendStatus(401);

  if (!facebookID) {
    return res.status(400).send('Missing facebook ID.');
  }

  let { user } = await facebookUsers.getFacebookUser(facebookID);
  if (user) return res.status(400).send('Facebook ID already linked.');

  // Add Facebook ID to user object
  let err = await users.setFacebookID(username, facebookID);
  if (err) {
    console.error(err);
    return res.status(400).send(err);
  }

  // Set Facebook picture
  if (hasFBPic) {
    err = await users.setProfilePicture(username, `https://graph.facebook.com/${facebookID}/picture?type=large`);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }
  }


  // Add facebook ID to facebookUser refererence
  err = await facebookUsers.setFacebookUser(facebookID, username);
  if (err) {
    console.error(err);
    return res.status(400).send(err);
  }

  // Return user object
  ({ user, err } = await users.getUser(username));
  if (err) {
    console.error(err);
    return	res.status(400).send(err);
  }
  res.status(200).json(user);
});

// Unlink facebook id to user
UsersRouter.get('/unlink/facebook/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  try {
    const { user, err } = await users.getUser(username);
    if (err) {
      console.error(err);
      return	res.status(400).send(err);
    }
    await users.updateUser(username, { facebookID: '', profileURL: '' });

    // Remove Facebook user
    await facebookUsers.removeFacebookUser(user.facebookID);

    user.facebookID = '';
    user.profileURL = '';
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Update user settings
UsersRouter.post('/edit/settings/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  // Convert req.body to object
  let user = Object.assign({}, req.body);

  try {
    let err = await auth.updateUserSettings(username, user);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }

    // Return updated user
    ({ user, err } = await users.getUser(username));
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Set user
// Body: { user }
UsersRouter.post('/set/user/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const user = {
    name: req.body.name || '',
    password: req.body.password || '',
    cart: req.body.cart || [],
    schedule: req.body.schedule || [],
    courseList: req.body.courseList || []
  };

  try {
    await users.setUser(username, user);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Update user
// Body: { user }
UsersRouter.post('/edit/:username', function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  users.updateUser(username, req.body, err => {
    if (err) {
      console.error(err);
      res.status(400).send(err);
    } else res.status(200).send(`User ${username} updated successfully.`);
  });
});

// Set cart
// Body: { cart }
UsersRouter.post('/set/cart/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const cart = await setCoursesPrereqs(req.body.cart);
  const err = await users.setCart(username, cart);
  if (err) {
    console.error(err);
    res.status(400).send(err);
  } else res.json(cart);
});

UsersRouter.post('/reorder/cart/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const err = await users.setCart(username, req.body.cart);
  if (err) {
    console.error(err);
    res.status(400).send(err);
  } else res.status(200).send(`Cart for User ${username} updated successfully.`);
});

// Set schedule
// Body: { schedule }
UsersRouter.post('/set/schedule/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const { schedule } = req.body;
  if (!schedule) return res.status(400).send('Missing fields.');

  try {
    const err = await users.setSchedule(username, schedule);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }
    res.status(200).send(`Schedule for User ${username} updated successfully.`);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});


UsersRouter.post('/add/schedule/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const { text } = req.body;
  if (!text) return res.status(400).send('Missing fields.');

  // Parse schedule
  const { term, courses } = parseSchedule(text);

  try {
    let { user, err } = await users.getUser(username);
    const schedule = user.schedule || {};
    schedule[term] = courses;
    // Upload schedule
    err = await users.setSchedule(username, schedule);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }

    user.schedule = schedule;
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Set courseList
// Body: { courseList }
UsersRouter.post('/set/courselist/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const courseList = await setCourseListPrereqs(req.body.courseList);
  // console.log(courseList)
  const err = await users.setCourseList(username, courseList);
  if (err) {
    console.error(err);
    res.status(400).send(err);
  } else res.json(courseList);
});

UsersRouter.post('/reorder/courselist/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const err = await users.setCourseList(username, req.body.courseList);
  if (err) {
    console.error(err);
    res.status(400).send(err);
  } else res.status(200).send(`Course list for User ${username} updated successfully.`);
});

const easterURL = images.getEasterURL();
UsersRouter.post('/upload/profile/:username', async function(req, res) {
  const username = req.params.username.toLowerCase();
  if (req.user !== username) return res.sendStatus(401);

  const { base64Str, contentType, easterRaph } = req.body;

  // User found easter egg
  if (easterRaph) {
    try {
      let err = await users.updateUser(username, { profileURL: easterURL });
      if (err) {
        console.error(err);
        return res.status(400).send(err);
      }

      // Return user object
      let user = null;
      ({ user, err } = await users.getUser(username));
      if (err) {
        console.error(err);
        return	res.status(400).send(err);
      }
      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      return res.status(400).send(err);
    }
  }

  if (!base64Str || !contentType) return res.status(400).send('Missing fields');

  try {
    let { err, publicUrl } = await images.setProfilePicture(username, req.body);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }

    // Update new profile img url in user object
    err = await users.setProfilePicture(username, publicUrl);
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }

    // Return user object
    let user = null;
    ({ user, err } = await users.getUser(username));
    if (err) {
      console.error(err);
      return res.status(400).send(err);
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

module.exports = UsersRouter;
