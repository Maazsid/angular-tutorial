const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  friends: [
    { 
      name: {type: String},
      roomName : {type:String},
      messages: [
        {
          sender: { type: String },
          message: { type: String },
          time: { type: String },
        }
    ]
    }
  ],
});

module.exports = mongoose.model('User', userSchema);
