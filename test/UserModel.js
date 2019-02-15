const mongoose = require('mongoose');
mongoose.connect('mongodb://root:example@localhost:27017/admin', {useNewUrlParser: true});


const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name:  String,
    email: String,
});


module.exports = mongoose.model('user', UserSchema);
