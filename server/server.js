const express = require('express');
const http = require('http');
const socket = require('socket.io');
const mongoose = require('mongoose');
const moment = require('moment');

const User = require('./models/users');
const Communities = require('./models/communities');

const app = express();

mongoose
  .connect('mongodb://127.0.0.1:27017/chatWire', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('successfully connected to mongodb.');
  })
  .catch((error) => {
    console.log('Unable to connect to mongo db.');
    console.log(error);
  });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

app.use(express.json());

app.post('/signup', (req, res, next) => {
  const findUserRegex = new RegExp(`^${req.body.name}$`, 'i');

  const user = new User({
    name: req.body.name,
  });

  User.findOne({ name: findUserRegex }).then((username) => {
    if (username !== null) {
      return res.status(400).json({ error: new Error('User already exists') });
    }
    user
      .save()
      .then((user) => {
        res.status(201).json({
          user,
        });
      })
      .catch((error) => {
        res.status(400).json({
          error: error,
        });
      });
  });
});

app.post('/login', (req, res, next) => {
  const findUserRegex = new RegExp(`^${req.body.name}$`, 'i');
  User.findOne({ name: findUserRegex })
    .then((user) => {
      if (user === null) {
        return res
          .status(400)
          .json({ error: new Error('User does not exist.') });
      }
      res.status(200).json({ user });
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
});

const server = http.createServer(app);
const io = socket(server);

io.on('connection', (socket) => {
  const loggedInUser = socket.handshake.query;
  const communities = Communities.find()
    .then((values) => {
      const communities = values;

      socket.emit('getCommunities', {
        communities,
      });

      communities.forEach((comm) => {
        socket.join(comm.roomName);
      });
    })
    .catch((err) => console.log(err));

  const users = User.findOne({ _id: loggedInUser._id })
    .then((user) => {
      if (user !== null) {
        user.friends.forEach((friend) => {
          socket.join(friend.roomName);
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });

  socket.on('addCommunity', ({ name }) => {
    const community = new Communities({
      name: name,
      roomName: name,
    });

    community
      .save()
      .then((community) => {
        Communities.find().then((communities) => {
          io.sockets.sockets.forEach((s) => {
            s.join(community.roomName);
            s.emit('newCommunities', communities);
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on('sendMessageToCommunity', ({ sender, message, id, roomName }) => {
    const time = moment().format('h:mm a');
    const query = { sender, message, time };
    Communities.updateOne({ _id: id }, { $push: { messages: query } }).then(
      (data) => {
        Communities.find().then((communities) => {
          io.to(roomName).emit('communityMessage', communities);
        });
      }
    );
  });

  socket.on('searchUser', ({ queryValue }) => {
    const regex = new RegExp(`${queryValue}`, 'ig');
    const query = { name: regex };
    User.find(query).then((users) => {
      socket.emit('returnedUsers', { users });
    });
  });

  socket.on('addFriend', ({ user, friend }) => {
    friend = friend[0];
    const userQuery = {
      name: friend.name,
      roomName: `${user.name}-${friend.name}`,
    };

    User.updateOne(
      { _id: user._id },
      { $push: { friends: userQuery } }
    ).then((ok) => {});

    const friendQuery = {
      name: user.name,
      roomName: `${user.name}-${friend.name}`,
    };
    User.updateOne(
      { _id: friend._id },
      { $push: { friends: friendQuery } }
    ).then(() => {});

    User.findOne({ _id: user._id }).then((user) => {
      socket.join(user.roomName);
      socket.emit('newFriend', { user });
    });
  });

  socket.on('sendMessageToFriend', ({ sender, message, id, roomName }) => {
    if (roomName.split('-')[0] !== sender) {
      friend = roomName.split('-')[0];
    } else {
      friend = roomName.split('-')[1];
    }

    const time = moment().format('h:mm a');
    const query = { sender, message, time };

    let userData;
    let friendData;
    
    const userUpdate = User.updateOne(
      { name: sender, 'friends.name': friend },
      { $push: { 'friends.$.messages': query } }
    )
  
    const friendUpdate = User.updateOne(
      { name: friend , 'friends.name' : sender },
      { $push: { 'friends.$.messages': query } },
    )
    
    Promise.all([userUpdate,friendUpdate])
    .then(() => {
      userData = User.findOne({name : sender})
      friendData= User.findOne({name : friend})

      Promise.all([userData,friendData])
      .then((data) => {
        userData = data[0];
        friendData = data[1];
        io.to(roomName).emit('newUserData',{userData,friendData});
      })

    })

   

  });
});

const PORT = 5000 || process.env.PORT;

server.listen(PORT, console.log(`Server running on port ${PORT}`));
