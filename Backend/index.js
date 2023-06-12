require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

//App Config
const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

//DB config
mongoose.connect('mongodb://127.0.0.1:27017/medicineReminderDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
},).then(() => console.log("connected"))
    .catch((err) => { console.error(err) });

// .then(()=>console.log('Connected Successfully'))
// .catch((err)=>{console.error(err);});

const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminded: Boolean
})

const Reminder = new mongoose.model("reminder", reminderSchema)

setInterval(async () => {
    try {
      const reminderList = await Reminder.find({}).exec();
      if (reminderList) {
        reminderList.forEach(async (reminder) => {
          if (!reminder.isReminded) {
            const now = new Date();
            if (new Date(reminder.remindAt) - now < 0) {
              await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });
              // WhatsApp Reminding Function
              client.messages
                .create({
                  body: reminder.reminderMsg,
                  from: 'whatsapp:+14155238886',
                  to: 'whatsapp:+919578547959', //ENTER YOUR MOBILE NUMBER <------------------------- IMPORTANT
                })
                .then((message) => console.log(message.sid));
            }
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, 10000);




const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);






//API routes
app.get("/getAllReminder", async (req, res) => {
    try {
        const reminderList = await Reminder.find({}).exec();
        res.send(reminderList);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
});

app.post("/addReminder", async (req, res) => {
    try {
        const { reminderMsg, remindAt } = req.body;
        const reminder = new Reminder({
            reminderMsg,
            remindAt,
            isReminded: false,
        });
        await reminder.save();
        const reminderList = await Reminder.find({});
        res.send(reminderList);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
});

app.post("/deleteReminder", async (req, res) => {
    try {
        await Reminder.deleteOne({ _id: req.body.id });
        const reminderList = await Reminder.find({}).exec();
        res.send(reminderList);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
});


app.listen(9000, () => console.log("Be started"))