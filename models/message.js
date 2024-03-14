const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    owner: {type:Schema.Types.ObjectId,ref:"Owner",required:false},
    username: {type:String,ref:"User Name",required:true},
    body: {type:String,required:true},
    public:{type:Boolean,required:true}
});

module.exports = mongoose.model("Message",messageSchema);
