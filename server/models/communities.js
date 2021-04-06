const mongoose = require('mongoose');

const communitiesSchema = mongoose.Schema({
  name: { type: String, required: true },
  roomName : {type:String},
  messages: [
    {
      sender: { type: String },
      message: { type: String },
      time: { type: String },
    },
  ],
});

module.exports = mongoose.model('Communities', communitiesSchema);
